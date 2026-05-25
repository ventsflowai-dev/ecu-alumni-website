import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import hero4 from "/assets/hero4.jpg";

const Gallery = () => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("gallery_events").select("*").eq("status", "published").order("event_date", { ascending: false }).then(({ data }) => setItems(data ?? []));
  }, []);

  return (
    <Layout>
      <section className="relative bg-black text-primary-foreground overflow-hidden">
        <div className="absolute inset-0">
          <img src={hero4} alt="ECU Alumni background" className="absolute inset-0 w-full h-full object-cover opacity-25" />
          {/* Base gradient overlay matching brand deep blue */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary/85 to-primary/50" />
          {/* Subtle red brand accent glow over the blue base */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsla(var(--accent)/0.35),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-accent/10 mix-blend-overlay" />
        </div>
        <div className="relative container py-28 md:py-36 lg:py-44 z-10">
          <FadeIn direction="up" delay={0.1}>
            <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-3">Gallery</div>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <h1 className="font-display text-4xl md:text-6xl font-bold">Moments from our journey</h1>
          </FadeIn>
        </div>
      </section>

      <section className="container py-16">
        {items.length === 0 ? (
          <FadeIn direction="up">
            <p className="text-muted-foreground text-center py-20">No gallery events published yet.</p>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((g) => (
              <StaggerItem key={g.id}>
                <Link to={`/gallery/${g.slug}`} className="group block h-full">
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary relative shadow-card hover:shadow-elegant transition-smooth h-full">
                    {g.cover_image_url ? (
                      <img src={g.cover_image_url} alt={g.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-hero" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/90 via-primary-deep/30 to-transparent" />
                    <div className="absolute bottom-0 p-5 text-primary-foreground w-full">
                      <h3 className="font-display text-xl font-bold mb-1.5">{g.title}</h3>
                      <div className="flex flex-wrap gap-3 text-xs opacity-90">
                        {g.event_date && <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" />{new Date(g.event_date).toLocaleDateString()}</span>}
                        {g.location && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{g.location}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </Layout>
  );
};

export default Gallery;
