import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, MapPin, Loader2, X } from "lucide-react";

const GalleryDetail = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState<any | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase.from("gallery_events").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
      setEvent(ev);
      if (ev) {
        const { data: imgs } = await supabase.from("gallery_images").select("*").eq("gallery_event_id", ev.id).order("created_at");
        setImages(imgs ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <Layout><div className="container py-32 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></Layout>;
  if (!event) return <Layout><div className="container py-32 text-center"><h1 className="font-display text-3xl">Gallery not found</h1></div></Layout>;

  return (
    <Layout>
      <div className="container py-16">
        <Link to="/gallery" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"><ArrowLeft className="h-4 w-4" />Back to gallery</Link>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{event.title}</h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground mb-6">
          {event.event_date && <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" />{new Date(event.event_date).toLocaleDateString("en", { dateStyle: "long" })}</span>}
          {event.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />{event.location}</span>}
        </div>
        {event.description && <p className="text-foreground/80 max-w-3xl mb-10 leading-relaxed">{event.description}</p>}

        {images.length === 0 ? (
          <p className="text-muted-foreground">No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <button key={img.id} onClick={() => setLightbox(img.image_url)} className="aspect-square overflow-hidden rounded-lg bg-secondary group">
                <img src={img.image_url} alt={img.caption ?? ""} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-smooth duration-500" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-primary-deep/95 backdrop-blur grid place-items-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-primary-foreground p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20"><X /></button>
          <img src={lightbox} alt="" className="max-h-[90vh] max-w-full rounded-lg shadow-elegant" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </Layout>
  );
};

export default GalleryDetail;
