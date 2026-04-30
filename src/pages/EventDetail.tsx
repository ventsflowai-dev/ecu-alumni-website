import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Clock, ArrowLeft, Loader2, ExternalLink } from "lucide-react";

const EventDetail = () => {
  const { slug } = useParams();
  const [e, setE] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("events").select("*").eq("slug", slug).eq("status", "published").maybeSingle().then(({ data }) => { setE(data); setLoading(false); });
  }, [slug]);

  if (loading) return <Layout><div className="container py-32 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></Layout>;
  if (!e) return <Layout><div className="container py-32 text-center"><h1 className="font-display text-3xl">Event not found</h1><Link to="/events" className="text-primary mt-4 inline-block">← Back to events</Link></div></Layout>;

  return (
    <Layout>
      <article className="container max-w-4xl py-16">
        <Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"><ArrowLeft className="h-4 w-4" />Back to events</Link>
        {e.featured_image_url && <img src={e.featured_image_url} alt={e.title} className="w-full aspect-[2/1] object-cover rounded-2xl mb-8 shadow-card" />}
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-balance">{e.title}</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-8">
          {e.event_date && <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" />{new Date(e.event_date).toLocaleDateString("en", { dateStyle: "full" })}</span>}
          {e.event_time && <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" />{e.event_time}</span>}
          {e.location && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" />{e.location}</span>}
        </div>
        <div className="prose prose-lg max-w-none prose-p:text-foreground/80">
          {e.full_description?.split("\n").map((p: string, i: number) => p.trim() && <p key={i}>{p}</p>)}
        </div>
        {e.registration_link && (
          <Button asChild size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground">
            <a href={e.registration_link} target="_blank" rel="noreferrer">Register Now <ExternalLink className="h-4 w-4 ml-2" /></a>
          </Button>
        )}
      </article>
    </Layout>
  );
};

export default EventDetail;
