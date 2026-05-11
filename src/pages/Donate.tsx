import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";
import { usePaystackPayment } from "react-paystack";
import { toast } from "sonner";

const Donate = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    supabase.from("donation_campaigns").select("*").eq("status", "active").order("created_at", { ascending: false }).then(({ data }) => {
      setCampaigns(data ?? []); setLoading(false);
    });
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  const config = {
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "",
    tx_ref: `tx-${Date.now()}`,
    amount: Number(amount) || 0,
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email,
      name,
      phone_number: "",
    },
    customizations: {
      title: "ECU Alumni Fellowship",
      description: `Donation for ${selectedCampaign?.title || "Campaign"}`,
      logo: "https://hng.tech/img/brand/logo.png", // A placeholder, ideally replace with ECU logo url
    },
  };

  const handleFlutterPayment = useFlutterwave(config);

  const handleDonateClick = (campaign: any) => {
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
    setName("");
    setEmail("");
    setAmount("");
  };

  const paystackConfig = {
    reference: `tx-${Date.now()}`,
    email: email,
    amount: (Number(amount) || 0) * 100, // Paystack expects kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
  };

  const initializePaystack = usePaystackPayment(paystackConfig);

  const handlePaystackSuccess = async (reference: any) => {
    const { error } = await supabase.from("donations").insert({
      campaign_id: selectedCampaign?.id || null,
      donor_name: name,
      donor_email: email,
      amount: Number(amount),
      currency: "NGN",
      payment_status: "successful",
      payment_reference: reference.reference ? String(reference.reference) : `tx-${Date.now()}`,
    });

    if (error) {
      console.error("Failed to log donation:", error);
      toast.error("Payment successful but failed to log record.");
    } else {
      toast.success("Thank you for your generous donation via Paystack!");
      if (selectedCampaign?.id) {
        const newAmount = Number(selectedCampaign.amount_raised || 0) + Number(amount);
        await supabase.from("donation_campaigns").update({ amount_raised: newAmount }).eq("id", selectedCampaign.id);
        setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? { ...c, amount_raised: newAmount } : c));
      }
    }
    setIsModalOpen(false);
  };

  const handlePaystackClose = () => {
    toast.error("Payment was not completed successfully.");
  };

  const handlePaystackSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!name || !email || !amount || Number(amount) <= 0) {
      toast.error("Please fill all details correctly.");
      return;
    }
    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      toast.error("Paystack integration is not fully set up (Missing API Key).");
      return;
    }
    initializePaystack({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose });
  };

  const handleFlutterwaveSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!name || !email || !amount || Number(amount) <= 0) {
      toast.error("Please fill all details correctly.");
      return;
    }
    if (!import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY) {
      toast.error("Payment integration is not fully set up (Missing API Key).");
      return;
    }

    handleFlutterPayment({
      callback: async (response) => {
        if (response.status === "successful" || response.status === "completed") {
          // Log donation to database for CMS visibility
          const { error } = await supabase.from("donations").insert({
            campaign_id: selectedCampaign?.id || null,
            donor_name: name,
            donor_email: email,
            amount: Number(amount),
            currency: "NGN",
            payment_status: "successful",
            payment_reference: response.transaction_id ? String(response.transaction_id) : `tx-${Date.now()}`,
            flutterwave_transaction_id: String(response.transaction_id || ""),
          });

          if (error) {
            console.error("Failed to log donation:", error);
            // We still show success since payment went through, but log error
            toast.error("Payment successful but failed to log record.");
          } else {
            toast.success("Thank you for your generous donation!");
            
            // Update campaign amount_raised
            if (selectedCampaign?.id) {
              const newAmount = Number(selectedCampaign.amount_raised || 0) + Number(amount);
              await supabase.from("donation_campaigns").update({ amount_raised: newAmount }).eq("id", selectedCampaign.id);
              
              // Update local state to reflect UI change immediately
              setCampaigns(prev => prev.map(c => c.id === selectedCampaign.id ? { ...c, amount_raised: newAmount } : c));
            }
          }
          
        } else {
          toast.error("Payment was not completed successfully.");
        }
        closePaymentModal();
        setIsModalOpen(false);
      },
      onClose: () => {
        // Payment modal closed
      },
    });
  };

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container py-20 md:py-24">
          <FadeIn direction="up" delay={0.1}>
            <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-3 flex items-center gap-2"><Heart className="h-4 w-4 fill-current" /> Give Here</div>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 text-balance">Partner with us in building the next generation.</h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.3}>
            <p className="text-lg text-primary-foreground/85 max-w-2xl">Your giving supports student outreaches, leadership development, welfare support, and alumni initiatives.</p>
          </FadeIn>
        </div>
      </section>

      <section className="container py-16">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : campaigns.length === 0 ? (
          <FadeIn direction="up">
            <Card className="p-12 text-center">
              <Heart className="h-10 w-10 text-accent mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold mb-2">Donation campaigns coming soon</h3>
              <p className="text-muted-foreground mb-6">Our admin will publish active campaigns here. In the meantime, please <Link to="/contact" className="text-primary underline">contact us</Link> to give directly.</p>
            </Card>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => {
              const pct = c.target_amount ? Math.min(100, (Number(c.amount_raised) / Number(c.target_amount)) * 100) : 0;
              return (
                <StaggerItem key={c.id}>
                  <Card className="overflow-hidden hover:shadow-elegant transition-smooth flex flex-col h-full">
                    <div className="aspect-[16/10] bg-secondary overflow-hidden">
                      {c.featured_image_url ? (
                        <img src={c.featured_image_url} alt={c.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-hero" />
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-display text-xl font-bold mb-2">{c.title}</h3>
                      {c.description && <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{c.description}</p>}
                      {c.target_amount && (
                        <div className="mb-4">
                          <Progress value={pct} className="h-2" />
                          <div className="flex justify-between text-xs mt-2">
                            <span className="font-semibold text-primary">{fmt(Number(c.amount_raised))}</span>
                            <span className="text-muted-foreground">of {fmt(Number(c.target_amount))}</span>
                          </div>
                        </div>
                      )}
                      <Button onClick={() => handleDonateClick(c)} className="mt-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                        Donate Now
                      </Button>
                    </div>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </section>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Donate to {selectedCampaign?.title}</DialogTitle>
            <DialogDescription>
              Please enter your details to proceed to secure checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (NGN)</Label>
              <Input id="amount" type="number" min="100" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button onClick={handleFlutterwaveSubmit} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                Pay with Flutterwave
              </Button>
              <Button onClick={handlePaystackSubmit} className="w-full bg-[#0ba4db] hover:bg-[#0ba4db]/90 text-white">
                Pay with Paystack
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </Layout>
  );
};

export default Donate;
