import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Gallery = () => {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("gallery_events").select("*").eq("status", "published").order("event_date", { ascending: false }).then(({ data }) => setItems(data ?? []));
  }, []);

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container py-20 md:py-24">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-3">Gallery</div>
          <h1 className="font-display text-4xl md:text-6xl font-bold">Moments from our journey</h1>
        </div>
      </section>

      <section className="container py-16">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">No gallery events published yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((g) => (
              <Link to={`/gallery/${g.slug}`} key={g.id} className="group block">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-secondary relative shadow-card hover:shadow-elegant transition-smooth">
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
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Gallery;
