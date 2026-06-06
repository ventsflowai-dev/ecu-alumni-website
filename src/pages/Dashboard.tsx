import { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, User, Heart, Megaphone, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download } from "lucide-react";

const Dashboard = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [donations, setDonations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    // Load profile (critical — unblocks the page)
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data, error }) => {
      if (error) toast.error("Could not load profile: " + error.message);
      setProfile(data ?? { user_id: user.id, full_name: "", email: user.email ?? "", status: "pending", directory_consent: false, show_email_publicly: false, show_phone_publicly: false });
    });
    // Load donations + resolve campaign titles separately (no FK declared)
    const emailFilter = user.email ? `,donor_email.eq.${user.email}` : "";
    supabase.from("donations").select("*").or(`user_id.eq.${user.id}${emailFilter}`).order("created_at", { ascending: false }).then(async ({ data }) => {
      const list = data ?? [];
      const ids = Array.from(new Set(list.map((d: any) => d.campaign_id).filter(Boolean)));
      let titleMap: Record<string, string> = {};
      if (ids.length) {
        const { data: camps } = await supabase.from("donation_campaigns").select("id,title").in("id", ids);
        (camps ?? []).forEach((c: any) => { titleMap[c.id] = c.title; });
      }
      setDonations(list.map((d: any) => ({ ...d, donation_campaigns: d.campaign_id ? { title: titleMap[d.campaign_id] } : null })));
    });
    supabase.from("announcements").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(10).then(({ data }) => setAnnouncements(data ?? []));
    supabase.from("events").select("*").eq("status", "published").eq("event_status", "upcoming").order("event_date").limit(5).then(({ data }) => setEvents(data ?? []));
  }, [user]);

  const updateField = (k: string, v: any) => setProfile((p: any) => ({ ...p, [k]: v }));

  const saveProfile = async () => {
    if (!profile || !user) return;
    setSaving(true);
    const { status, role, user_id, id, created_at, updated_at, email, ...updatable } = profile;
    const { error } = await supabase.from("profiles").update(updatable).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile saved!");
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    updateField("profile_photo_url", data.publicUrl);
    await supabase.from("profiles").update({ profile_photo_url: data.publicUrl }).eq("user_id", user.id);
    toast.success("Photo uploaded");
  };

  const addLogo = async (doc: jsPDF, x: number, y: number, w: number, h: number) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      // Use absolute path for logo since we know it's in public folder as well
      img.src = "/logo.png";
      img.onload = () => {
        doc.addImage(img, "PNG", x, y, w, h);
        resolve();
      };
      img.onerror = reject;
    });
  };

  const downloadSingleReceipt = async (donation: any) => {
    const doc = new jsPDF();
    
    try {
      await addLogo(doc, 20, 20, 22, 22);
    } catch (e) {
      console.error("Failed to load logo for PDF");
    }

    // Elegant letterhead/brand header next to top-left logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(29, 44, 134); // Brand Primary Royal Blue
    doc.text("EVANGELICAL CHRISTIAN UNION ALUMNI FELLOWSHIP", 47, 26);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 85, 114); // Brand Muted Blue-Grey
    doc.text("Obafemi Awolowo University, Ile-Ife, Nigeria", 47, 31);
    doc.text("Email: info@ecualumni.org | Web: ecualumni.org", 47, 36);

    // Two-tone brand stripe divider lines
    doc.setDrawColor(29, 44, 134); // Royal Blue
    doc.setLineWidth(1.5);
    doc.line(20, 45, 190, 45);

    doc.setDrawColor(227, 28, 48); // Accent Red
    doc.setLineWidth(0.5);
    doc.line(20, 47, 190, 47);

    // Receipt Title & Support Subtitle
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(17, 27, 95); // Deep navy
    doc.text("OFFICIAL DONATION RECEIPT", 20, 58);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 85, 114);
    doc.text("Thank you for your generous support. Your contribution is highly appreciated.", 20, 64);

    // High-visibility Donation Amount Banner Box
    doc.setFillColor(245, 246, 250); // soft grey background
    doc.rect(20, 70, 170, 24, "F");

    doc.setFillColor(29, 44, 134); // Primary Accent strip on left of banner
    doc.rect(20, 70, 3, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("DONATION AMOUNT", 28, 78);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(29, 44, 134);
    const amountVal = `${donation.currency || "NGN"} ${Number(donation.amount).toLocaleString()}`;
    doc.text(amountVal, 28, 88);

    // Payment Status badge in banner
    doc.setFillColor(220, 252, 231); // Success soft green background
    doc.rect(130, 78, 50, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61); // dark success green
    doc.text("PAYMENT SUCCESSFUL", 155, 83.5, { align: "center" });

    // Grid of Details Section Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(29, 44, 134);
    doc.text("DONOR INFORMATION", 20, 108);
    doc.text("TRANSACTION DETAILS", 110, 108);

    // Section sub-header divider lines
    doc.setDrawColor(222, 224, 235);
    doc.setLineWidth(0.5);
    doc.line(20, 111, 95, 111);
    doc.line(110, 111, 190, 111);

    const curY = 118;
    const donorNameVal = donation.donor_name || profile?.full_name || "Anonymous Donor";
    const donorEmailVal = donation.donor_email || profile?.email || "N/A";
    const donorPhoneVal = donation.donor_phone || profile?.phone || "N/A";

    // Column 1: Donor Information Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("DONOR NAME", 20, curY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 27, 95);
    doc.text(donorNameVal, 20, curY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("EMAIL ADDRESS", 20, curY + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 27, 95);
    doc.text(donorEmailVal, 20, curY + 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("PHONE NUMBER", 20, curY + 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 27, 95);
    doc.text(donorPhoneVal, 20, curY + 35);

    // Column 2: Transaction Details
    const paymentRef = donation.payment_reference || "N/A";
    const campaignTitle = donation.donation_campaigns?.title || "General Fellowship Support";
    const paymentDateStr = new Date(donation.created_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const receiptGenDateStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("SUPPORTED CAMPAIGN", 110, curY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 27, 95);
    const splitCampaign = doc.splitTextToSize(campaignTitle, 80);
    doc.text(splitCampaign, 110, curY + 5);

    const campaignLinesCount = splitCampaign.length;
    const campaignOffset = (campaignLinesCount - 1) * 4.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("TRANSACTION REFERENCE", 110, curY + 15 + campaignOffset);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 27, 95);
    doc.text(paymentRef, 110, curY + 20 + campaignOffset);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("PAYMENT METHOD", 110, curY + 30 + campaignOffset);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 27, 95);
    doc.text("Paystack Checkout (Secure)", 110, curY + 35 + campaignOffset);

    // Section for Dates and Generation metadata
    const dateSectionY = curY + 50 + campaignOffset;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(29, 44, 134);
    doc.text("DATE & METADATA", 20, dateSectionY);

    doc.setDrawColor(222, 224, 235);
    doc.setLineWidth(0.5);
    doc.line(20, dateSectionY + 3, 190, dateSectionY + 3);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("DATE OF PAYMENT", 20, dateSectionY + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 27, 95);
    doc.text(paymentDateStr, 20, dateSectionY + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(80, 85, 114);
    doc.text("RECEIPT GENERATED ON", 110, dateSectionY + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 27, 95);
    doc.text(receiptGenDateStr, 110, dateSectionY + 15);

    // Elegant professional footer
    const footerY = 252;
    doc.setDrawColor(222, 224, 235);
    doc.setLineWidth(0.5);
    doc.line(20, footerY, 190, footerY);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(29, 44, 134);
    doc.text("“Every man shall give as he is able, according to the blessing of the Lord your God which He has given you.”", 105, footerY + 8, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 125, 150);
    doc.text("This is an electronically generated document. No physical signature is required.", 105, footerY + 15, { align: "center" });
    doc.text("Evangelical Christian Union Alumni Fellowship © 2026. All Rights Reserved.", 105, footerY + 20, { align: "center" });

    doc.save(`Receipt_${donation.payment_reference || donation.id}.pdf`);
  };

  const downloadAllReceipts = async () => {
    const doc = new jsPDF();
    
    try {
      await addLogo(doc, 20, 20, 22, 22);
    } catch (e) {
      console.error("Failed to load logo for PDF");
    }

    // Elegant brand header matching single receipt
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(29, 44, 134);
    doc.text("EVANGELICAL CHRISTIAN UNION ALUMNI FELLOWSHIP", 47, 26);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 85, 114);
    doc.text("Obafemi Awolowo University, Ile-Ife, Nigeria", 47, 31);
    doc.text("Email: info@ecualumni.org | Web: ecualumni.org", 47, 36);

    // Two-tone divider lines
    doc.setDrawColor(29, 44, 134);
    doc.setLineWidth(1.5);
    doc.line(20, 45, 190, 45);

    doc.setDrawColor(227, 28, 48);
    doc.setLineWidth(0.5);
    doc.line(20, 47, 190, 47);

    // Title and Meta information
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(17, 27, 95);
    doc.text("DONATION SUMMARY & HISTORY", 20, 58);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 85, 114);
    doc.text(`Donor Profile: ${profile?.full_name || "N/A"} (${profile?.email || user?.email || "N/A"})`, 20, 64);
    doc.text(`Summary generated on: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 20, 69);

    const successfulDonations = donations.filter((d) => d.payment_status === "successful");
    
    const tableData = successfulDonations.map((d) => [
      new Date(d.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      d.donation_campaigns?.title || "General Fellowship Support",
      `${d.currency} ${Number(d.amount).toLocaleString()}`,
      d.payment_reference || "—",
    ]);

    const total = successfulDonations.reduce((sum, d) => sum + Number(d.amount), 0);

    // Premium table rendering using jspdf-autotable
    autoTable(doc, {
      startY: 75,
      margin: { left: 20, right: 20 },
      head: [["Date", "Campaign / Purpose", "Amount", "Transaction Reference"]],
      body: tableData,
      foot: [["", "Cumulative Total", `NGN ${total.toLocaleString()}`, ""]],
      theme: "striped",
      headStyles: {
        fillColor: [29, 44, 134],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      footStyles: {
        fillColor: [245, 246, 250],
        textColor: [29, 44, 134],
        fontStyle: "bold",
        fontSize: 9.5,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 65 },
        2: { cellWidth: 30, fontStyle: "bold" },
        3: { cellWidth: 40 },
      },
      alternateRowStyles: {
        fillColor: [250, 251, 253],
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || 180;
    const footerY = Math.max(finalY + 15, 252);

    if (footerY < 280) {
      doc.setDrawColor(222, 224, 235);
      doc.setLineWidth(0.5);
      doc.line(20, footerY, 190, footerY);

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(29, 44, 134);
      doc.text("“Every man shall give as he is able, according to the blessing of the Lord your God which He has given you.”", 105, footerY + 8, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(120, 125, 150);
      doc.text("This is an electronically generated statement of all recorded contributions.", 105, footerY + 15, { align: "center" });
      doc.text("Evangelical Christian Union Alumni Fellowship © 2026. All Rights Reserved.", 105, footerY + 20, { align: "center" });
    }

    doc.save("ECU_Alumni_Donation_Summary.pdf");
  };

  if (!profile) return <Layout><div className="container py-32 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></Layout>;

  if (profile.status !== "approved" && !isAdmin) {
    const isPending = profile.status === "pending";
    return (
      <Layout>
        <div className="container max-w-md py-24">
          <Card className="p-8 text-center border border-border/80 shadow-elegant">
            {isPending ? (
              <>
                <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Account Pending Review</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Thank you for signing up! Your profile is currently under review by the alumni administration. 
                  You will receive an email notification as soon as your account has been verified.
                </p>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-red-500" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2 text-destructive">Account Suspended</h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Your account has been suspended by the administrators. If you believe this is a mistake, please contact support.
                </p>
              </>
            )}
            <Button onClick={signOut} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Sign Out
            </Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const statusColor = profile.status === "approved" ? "bg-green-100 text-green-800" : profile.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";

  return (
    <Layout>
      <div className="container py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {profile.full_name || "friend"}.</p>
          </div>
          <Badge className={statusColor}>Profile: {profile.status}</Badge>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="profile"><User className="h-4 w-4 mr-1.5" />Profile</TabsTrigger>
            <TabsTrigger value="donations"><Heart className="h-4 w-4 mr-1.5" />Donations</TabsTrigger>
            <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 mr-1.5" />Announcements</TabsTrigger>
            <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-1.5" />Events</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-5 mb-8">
                <Avatar className="h-24 w-24 ring-4 ring-accent/20">
                  <AvatarImage src={profile.profile_photo_url} />
                  <AvatarFallback className="bg-gradient-hero text-primary-foreground text-xl">{profile.full_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
                  <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 mr-2" />Upload photo</Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG or PNG, up to 5MB.</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div><Label>Full name</Label><Input value={profile.full_name ?? ""} onChange={(e) => updateField("full_name", e.target.value)} /></div>
                <div><Label>Email</Label><Input value={profile.email ?? ""} disabled /></div>
                <div><Label>Phone</Label><Input value={profile.phone ?? ""} onChange={(e) => updateField("phone", e.target.value)} /></div>
                <div><Label>Year of graduation</Label><Input type="number" value={profile.graduation_year ?? ""} onChange={(e) => updateField("graduation_year", e.target.value ? parseInt(e.target.value) : null)} /></div>
                <div><Label>Department / course</Label><Input value={profile.department ?? ""} onChange={(e) => updateField("department", e.target.value)} /></div>
                <div><Label>Faculty</Label><Input value={profile.faculty ?? ""} onChange={(e) => updateField("faculty", e.target.value)} /></div>
                <div><Label>Current city</Label><Input value={profile.current_city ?? ""} onChange={(e) => updateField("current_city", e.target.value)} /></div>
                <div><Label>Current country</Label><Input value={profile.current_country ?? ""} onChange={(e) => updateField("current_country", e.target.value)} /></div>
                <div><Label>Profession / industry</Label><Input value={profile.profession ?? ""} onChange={(e) => updateField("profession", e.target.value)} /></div>
                <div><Label>Workplace / business</Label><Input value={profile.workplace ?? ""} onChange={(e) => updateField("workplace", e.target.value)} /></div>
              </div>
              <div className="mt-5">
                <Label>Short bio</Label>
                <Textarea rows={4} value={profile.bio ?? ""} onChange={(e) => updateField("bio", e.target.value)} />
              </div>

              <div className="mt-6 space-y-4 border-t border-border pt-6">
                <h3 className="font-display text-lg font-semibold">Privacy & Directory</h3>
                <div className="flex items-center justify-between">
                  <div><div className="font-medium">Appear in alumni directory</div><div className="text-sm text-muted-foreground">Required to be visible to others.</div></div>
                  <Switch checked={profile.directory_consent} onCheckedChange={(v) => updateField("directory_consent", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><div className="font-medium">Show email publicly</div><div className="text-sm text-muted-foreground">Off by default.</div></div>
                  <Switch checked={profile.show_email_publicly} onCheckedChange={(v) => updateField("show_email_publicly", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div><div className="font-medium">Show phone publicly</div><div className="text-sm text-muted-foreground">Off by default.</div></div>
                  <Switch checked={profile.show_phone_publicly} onCheckedChange={(v) => updateField("show_phone_publicly", v)} />
                </div>
              </div>

              <Button onClick={saveProfile} disabled={saving} size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save changes
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="donations">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
                <h2 className="font-display text-2xl font-bold">My Donation History</h2>
                {donations.filter(d => d.payment_status === "successful").length > 0 && (
                  <Button onClick={downloadAllReceipts} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" /> Download Summary
                  </Button>
                )}
              </div>
              {donations.length === 0 ? (
                <p className="text-muted-foreground">You have not made any donations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground border-b">
                      <tr><th className="py-2">Date</th><th>Campaign</th><th>Amount</th><th>Reference</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      {donations.map((d) => (
                        <tr key={d.id} className="border-b last:border-0">
                          <td className="py-3">{new Date(d.created_at).toLocaleDateString()}</td>
                          <td>{d.donation_campaigns?.title ?? "—"}</td>
                          <td className="font-semibold">{d.currency} {Number(d.amount).toLocaleString()}</td>
                          <td className="font-mono text-xs">{d.payment_reference ?? "—"}</td>
                          <td><Badge variant={d.payment_status === "successful" ? "default" : "secondary"}>{d.payment_status}</Badge></td>
                          <td className="text-right">
                            {d.payment_status === "successful" && (
                              <Button onClick={() => downloadSingleReceipt(d)} variant="ghost" size="icon" title="Download Receipt">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card className="p-6">
              <h2 className="font-display text-2xl font-bold mb-4">Announcements</h2>
              {announcements.length === 0 ? (
                <p className="text-muted-foreground">No announcements yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="border-l-2 border-accent pl-4 py-2">
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card className="p-6">
              <h2 className="font-display text-2xl font-bold mb-4">Upcoming Events</h2>
              {events.length === 0 ? (
                <p className="text-muted-foreground">No upcoming events.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((e) => (
                    <div key={e.id} className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <div className="font-semibold">{e.title}</div>
                        <div className="text-xs text-muted-foreground">{e.event_date && new Date(e.event_date).toLocaleDateString()} • {e.location}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Dashboard;
