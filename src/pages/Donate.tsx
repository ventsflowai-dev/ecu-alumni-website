import { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, Loader2, Sparkles, CreditCard, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import { useAuth } from "@/hooks/useAuth";
import { usePaystackPayment } from "react-paystack";
import { toast } from "sonner";
import hero3 from "/assets/hero3.jpg";

const Donate = () => {
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  // Reference to store active donation ID safely for Paystack closure/success callback
  const donationIdRef = useRef<string | null>(null);

  // Fetch active campaigns on load
  useEffect(() => {
    supabase
      .from("donation_campaigns")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCampaigns(data ?? []);
        setLoading(false);
      });
  }, []);

  // Auto-fill profile details if user is logged in
  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("full_name,email,phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDonorName(data.full_name ?? "");
          setDonorEmail(data.email ?? user.email ?? "");
          setDonorPhone(data.phone ?? "");
        } else {
          setDonorEmail(user.email ?? "");
        }
      });
  }, [user]);

  // Formatter for Currency
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);

  // Build unique secure transaction reference
  const txRef = `ECU-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Paystack React Hook Configuration
  const paystackConfig = {
    reference: txRef,
    email: donorEmail || "anonymous@ecu-alumni.org",
    amount: Math.round((Number(amount) || 0) * 100), // Paystack requires amount in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
  };

  const initializePaystack = usePaystackPayment(paystackConfig);

  // Secure Server-side verification handler
  const handlePaystackSuccess = async (reference: any) => {
    const donationId = donationIdRef.current;
    if (!donationId) {
      toast.error("Security/system error: reference link was broken.");
      setProcessing(false);
      return;
    }

    const verificationToast = toast.loading("Verifying your payment securely with Paystack...");

    try {
      // Invoke the Deno Edge Function securely on the server
      const { data, error } = await supabase.functions.invoke("verify-paystack-payment", {
        body: {
          reference: reference.reference,
          donation_id: donationId,
        },
      });

      toast.dismiss(verificationToast);

      if (error || !data?.success) {
        console.error("Verification error response:", error || data);
        toast.error(error?.message || data?.error || "Could not securely verify transaction. Please contact support.");
        return;
      }

      toast.success("Thank you! Your donation was successfully verified and recorded.");
      
      // Update campaigns listing to show updated raised amount immediately
      const { data: refreshedCampaigns } = await supabase
        .from("donation_campaigns")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (refreshedCampaigns) {
        setCampaigns(refreshedCampaigns);
      }

      // Reset form states and close modal
      setIsModalOpen(false);
      setSelectedCampaign(null);
      setAmount("");
      setMessage("");
    } catch (err: any) {
      toast.dismiss(verificationToast);
      console.error("Verification system exception:", err);
      toast.error("A network error occurred during payment verification.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaystackClose = () => {
    toast.error("Checkout closed. Payment was not completed.");
    setProcessing(false);
  };

  // Triggers checkout flow securely
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCampaign) return;

    if (!donorName.trim() || !donorEmail.trim()) {
      toast.error("Please fill in your name and email address.");
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 100) {
      toast.error("Minimum donation amount is ₦100.");
      return;
    }

    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      toast.error("Paystack system public key is not configured. Please contact the administrator.");
      return;
    }

    setProcessing(true);

    // 1. Insert an audit-ready PENDING transaction record to prevent spoofing
    const { data: donation, error } = await supabase
      .from("donations")
      .insert({
        user_id: user?.id ?? null,
        campaign_id: selectedCampaign.id,
        donor_name: donorName.trim(),
        donor_email: donorEmail.trim(),
        donor_phone: donorPhone.trim() || null,
        amount: numericAmount,
        currency: "NGN",
        donor_message: message.trim() || null,
        payment_reference: txRef,
        payment_status: "pending",
      })
      .select()
      .single();

    if (error || !donation) {
      console.error("Database insert error:", error);
      toast.error(error?.message || "Failed to initialize secure transaction in database.");
      setProcessing(false);
      return;
    }

    // 2. Lock the active donation ID to the reference state
    donationIdRef.current = donation.id;

    // 3. Close the Radix Dialog immediately to unblock pointer-events on the document body
    setIsModalOpen(false);

    // 4. Fire Paystack Checkout Modal
    initializePaystack({
      onSuccess: handlePaystackSuccess,
      onClose: handlePaystackClose,
    });
  };

  const handleDonateClick = (campaign: any) => {
    setSelectedCampaign(campaign);
    setAmount("");
    setMessage("");
    setIsModalOpen(true);
  };

  return (
    <Layout>
      {/* HERO SECTION */}
      <section className="relative bg-black text-primary-foreground overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero3} alt="ECU Alumni background" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          {/* Base gradient overlay matching brand deep blue */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary/85 to-primary/50" />
          {/* Subtle red brand accent glow over the blue base */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsla(var(--accent)/0.35),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-accent/10 mix-blend-overlay" />
        </div>
        <div className="relative container py-28 md:py-36 lg:py-44 z-10">
          <FadeIn direction="up" delay={0.1}>
            <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 fill-current text-accent" /> Partner With Us
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 text-balance">
              Partner with us in building the next generation.
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.3}>
            <p className="text-lg text-primary-foreground/85 max-w-2xl leading-relaxed">
              Your giving supports student outreaches, leadership development, welfare support, and alumni initiatives at Obafemi Awolowo University.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CAMPAIGNS SECTION */}
      <section className="container py-16">
        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : campaigns.length === 0 ? (
          <FadeIn direction="up">
            <Card className="p-12 text-center max-w-xl mx-auto border-dashed border-2">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold mb-2">No active campaigns</h3>
              <p className="text-muted-foreground mb-6">
                Our administrators will publish active giving campaigns here soon. In the meantime, you can reach out to give directly.
              </p>
              <Button asChild variant="outline">
                <Link to="/contact">Contact Administration</Link>
              </Button>
            </Card>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => {
              const pct = c.target_amount
                ? Math.min(
                    100,
                    (Number(c.amount_raised) / Number(c.target_amount)) * 100
                  )
                : 0;

              return (
                <StaggerItem key={c.id}>
                  <Card className="overflow-hidden hover:shadow-elegant transition-smooth flex flex-col h-full border-border/60 hover:border-primary/20">
                    <div className="aspect-[16/10] bg-secondary overflow-hidden relative group">
                      {c.featured_image_url ? (
                        <img
                          src={c.featured_image_url}
                          alt={c.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-hero flex items-center justify-center opacity-85">
                          <Heart className="h-12 w-12 text-primary-foreground/30" />
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-display text-xl font-bold mb-2 text-foreground line-clamp-2">
                        {c.title}
                      </h3>

                      {c.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-6">
                          {c.description}
                        </p>
                      )}

                      {c.target_amount && (
                        <div className="mb-6 mt-auto">
                          <div className="flex justify-between text-xs mb-2">
                            <span className="font-semibold text-primary">{fmt(Number(c.amount_raised))} raised</span>
                            <span className="text-muted-foreground">goal of {fmt(Number(c.target_amount))}</span>
                          </div>
                          <Progress value={pct} className="h-2 bg-secondary" />
                        </div>
                      )}

                      <Button
                        onClick={() => handleDonateClick(c)}
                        className="w-full mt-auto bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-glow"
                      >
                        Donate to Campaign
                      </Button>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </section>

      {/* SECURE DONATION FLOW MODAL (SHADCN DIALOG) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border/80 p-6 rounded-2xl shadow-elegant max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="h-10 w-10 rounded-full bg-accent/10 text-accent flex items-center justify-center mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <DialogTitle className="font-display text-2xl font-bold text-foreground">
              Donate to {selectedCampaign?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Your contribution will support kingdom work. Transactions are securely processed via Paystack.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckoutSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="donorName" className="text-xs font-semibold text-muted-foreground">Full Name</Label>
              <Input
                id="donorName"
                required
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="John Doe"
                className="bg-secondary/40 border-border/40 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="donorEmail" className="text-xs font-semibold text-muted-foreground">Email Address</Label>
              <Input
                id="donorEmail"
                type="email"
                required
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder="johndoe@example.com"
                className="bg-secondary/40 border-border/40 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="donorPhone" className="text-xs font-semibold text-muted-foreground">Phone Number (Optional)</Label>
              <Input
                id="donorPhone"
                type="tel"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                placeholder="+234..."
                className="bg-secondary/40 border-border/40 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground">Donation Amount (NGN)</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">₦</span>
                <Input
                  id="amount"
                  type="number"
                  min="100"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 bg-secondary/40 border-border/40 focus-visible:ring-primary font-semibold text-foreground"
                />
              </div>
            </div>

            {/* Dynamic Suggested Amounts Quick Selection */}
            {selectedCampaign && Array.isArray(selectedCampaign.suggested_amounts) && selectedCampaign.suggested_amounts.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedCampaign.suggested_amounts.map((item: number) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setAmount(String(item))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth border ${
                      amount === String(item)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/50 text-muted-foreground border-border/40 hover:bg-secondary"
                    }`}
                  >
                    {fmt(Number(item))}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="message" className="text-xs font-semibold text-muted-foreground">Add a Message (Optional)</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="May God bless ECU..."
                className="bg-secondary/40 border-border/40 focus-visible:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-secondary/30 p-2.5 rounded-lg border border-border/20 mt-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>We never store card details. Paystack secures all payments with PCI-DSS compliance.</span>
            </div>

            <Button
              type="submit"
              disabled={processing}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold mt-4 h-11 shadow-glow"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {amount ? `Pay Securely ${fmt(Number(amount))}` : "Proceed to Secure Pay"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Donate;
