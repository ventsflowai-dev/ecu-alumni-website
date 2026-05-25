import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Phone, Mail, Instagram, Facebook, Twitter, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { PartnerCTA } from "@/components/PartnerCTA";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import hero2 from "/assets/hero2.jpg";

const schema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
});

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      full_name: result.data.full_name,
      email: result.data.email,
      subject: result.data.subject || null,
      message: result.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to send. Please try again.");
    } else {
      toast.success("Message sent! We'll be in touch soon.");
      setForm({ full_name: "", email: "", subject: "", message: "" });
    }
  };

  return (
    <Layout>
      <section className="relative bg-black text-primary-foreground overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero2} alt="ECU Alumni background" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          {/* Base gradient overlay matching brand deep blue */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary/85 to-primary/50" />
          {/* Subtle red brand accent glow over the blue base */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsla(var(--accent)/0.35),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-accent/10 mix-blend-overlay" />
        </div>
        <div className="relative container py-28 md:py-36 lg:py-44 z-10">
          <div className="max-w-3xl">
            <FadeIn direction="up" delay={0.1}>
              <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-4">Contact Us</div>
            </FadeIn>
            <FadeIn direction="up" delay={0.2}>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 text-balance">We Would Love to Hear from You</h1>
            </FadeIn>
            <FadeIn direction="up" delay={0.3}>
              <p className="text-lg text-primary-foreground/85">Please write or call us with your questions or comments.</p>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="container py-20 grid lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <FadeIn direction="up">
              <h3 className="font-display text-2xl font-bold mb-5">Reach us</h3>
            </FadeIn>
            <StaggerContainer className="space-y-5">
              <StaggerItem>
                <li className="flex gap-4">
                  <div className="h-11 w-11 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0"><MapPin className="h-5 w-5" /></div>
                  <div><div className="font-semibold">Address</div><div className="text-sm text-muted-foreground">ECU Empowerment Center, Obafemi Awolowo University, Ile-Ife, Osun State.</div></div>
                </li>
              </StaggerItem>
              <StaggerItem>
                <li className="flex gap-4">
                  <div className="h-11 w-11 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0"><Phone className="h-5 w-5" /></div>
                  <div><div className="font-semibold">Phone</div><a href="tel:+2348133836864" className="text-sm text-muted-foreground hover:text-primary">+234 813 383 6864</a></div>
                </li>
              </StaggerItem>
              <StaggerItem>
                <li className="flex gap-4">
                  <div className="h-11 w-11 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0"><Mail className="h-5 w-5" /></div>
                  <div><div className="font-semibold">Email</div><a href="mailto:ecuifealunmi@gmail.com" className="text-sm text-muted-foreground hover:text-primary break-all">ecuifealunmi@gmail.com</a></div>
                </li>
              </StaggerItem>
            </StaggerContainer>
          </div>
          <div>
            <FadeIn direction="up" delay={0.2}>
              <h4 className="font-display text-lg font-semibold mb-4">Keep In Touch</h4>
              <div className="flex gap-3">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground transition-smooth"><Instagram className="h-5 w-5" /></a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground transition-smooth"><Facebook className="h-5 w-5" /></a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-3 rounded-full bg-secondary hover:bg-accent hover:text-accent-foreground transition-smooth"><Twitter className="h-5 w-5" /></a>
              </div>
            </FadeIn>
          </div>
        </div>

        <FadeIn direction="left" className="lg:col-span-3">
          <Card className="p-8">
            <h3 className="font-display text-2xl font-bold mb-6">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Name *</Label>
                  <Input id="full_name" required maxLength={200} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required maxLength={320} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" maxLength={200} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea id="message" required rows={6} maxLength={5000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </div>
              <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90 text-accent-foreground" size="lg">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Message
              </Button>
            </form>
          </Card>
        </FadeIn>
      </section>

      <FadeIn direction="up">
        <PartnerCTA />
      </FadeIn>
    </Layout>
  );
};

export default Contact;
