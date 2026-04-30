import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const Donate = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("donation_campaigns").select("*").eq("status", "active").order("created_at", { ascending: false }).then(({ data }) => {
      setCampaigns(data ?? []); setLoading(false);
    });
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container py-20 md:py-24">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-3 flex items-center gap-2"><Heart className="h-4 w-4 fill-current" /> Give Here</div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 text-balance">Partner with us in building the next generation.</h1>
          <p className="text-lg text-primary-foreground/85 max-w-2xl">Your giving supports student outreaches, leadership development, welfare support, and alumni initiatives.</p>
        </div>
      </section>

      <section className="container py-16">
        {loading ? (
          <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : campaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-10 w-10 text-accent mx-auto mb-4" />
            <h3 className="font-display text-2xl font-bold mb-2">Donation campaigns coming soon</h3>
            <p className="text-muted-foreground mb-6">Our admin will publish active campaigns here. In the meantime, please <Link to="/contact" className="text-primary underline">contact us</Link> to give directly.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((c) => {
              const pct = c.target_amount ? Math.min(100, (Number(c.amount_raised) / Number(c.target_amount)) * 100) : 0;
              return (
                <Card key={c.id} className="overflow-hidden hover:shadow-elegant transition-smooth flex flex-col">
                  <div className="aspect-[16/10] bg-secondary overflow-hidden">
                    {c.featured_image_url ? (
                      <img src={c.featured_image_url} alt={c.title} loading="lazy" className="w-full h-full object-cover" />
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
                    <Button className="mt-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled>
                      Donate (Coming Soon)
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mt-12 p-8 bg-secondary/40 border-dashed">
          <p className="text-sm text-muted-foreground text-center">
            <strong className="text-foreground">Note:</strong> Flutterwave checkout & PDF receipts will be wired up in the next phase. Once your Flutterwave keys are added, donate buttons here will become live and donations will be tracked per campaign.
          </p>
        </Card>
      </section>
    </Layout>
  );
};

export default Donate;
