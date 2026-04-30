import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const EventsPage = () => {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("events").select("*").eq("status", "published").eq("event_status", "upcoming").order("event_date", { ascending: true }).then(({ data }) => setUpcoming(data ?? []));
    supabase.from("events").select("*").eq("status", "published").eq("event_status", "past").order("event_date", { ascending: false }).then(({ data }) => setPast(data ?? []));
  }, []);

  const renderCard = (e: any) => (
    <Link key={e.id} to={`/events/${e.slug}`} className="group">
      <Card className="overflow-hidden h-full hover:shadow-elegant hover:-translate-y-1 transition-smooth">
        <div className="aspect-[16/10] bg-secondary overflow-hidden">
          {e.featured_image_url ? (
            <img src={e.featured_image_url} alt={e.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-hero" />
          )}
        </div>
        <div className="p-6">
          <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-smooth">{e.title}</h3>
          {e.short_description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{e.short_description}</p>}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            {e.event_date && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />{new Date(e.event_date).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>}
            {e.event_time && <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />{e.event_time}</div>}
            {e.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{e.location}</div>}
          </div>
        </div>
      </Card>
    </Link>
  );

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container py-20 md:py-24">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-3">Events</div>
          <h1 className="font-display text-4xl md:text-6xl font-bold">Reunions, programs & gatherings</h1>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="font-display text-3xl font-bold mb-8">Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <p className="text-muted-foreground">No upcoming events scheduled.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{upcoming.map(renderCard)}</div>
        )}

        <h2 className="font-display text-3xl font-bold mt-20 mb-8">Past Events</h2>
        {past.length === 0 ? (
          <p className="text-muted-foreground">No past events to show.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{past.map(renderCard)}</div>
        )}
      </section>
    </Layout>
  );
};

export default EventsPage;
