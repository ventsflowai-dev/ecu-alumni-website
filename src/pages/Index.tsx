import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Heart, Users, Calendar, GraduationCap, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { PartnerCTA } from "@/components/PartnerCTA";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import { supabase } from "@/integrations/supabase/client";
import hero1 from "/assets/hero1.jpg";
import hero2 from "/assets/hero2.jpg";
import hero3 from "/assets/hero3.jpg";
import hero4 from "/assets/hero4.jpg";
import about from "/assets/about.jpg";

const whatWeDo = [
  { n: "01", icon: BookOpen, title: "We Nurture Spiritual Growth", text: "We care intentionally for the spiritual needs of the ECU Alumni Global Fellowship through prayer platforms, biblical teaching, fellowship gatherings, and accountability structures that help members remain grounded in the Word and steadfast in faith." },
  { n: "02", icon: HandHeart, title: "We Provide Care & Support", text: "We offer practical and compassionate support to alumni members in times of need, fostering a culture of love, generosity, and responsibility within the fellowship community." },
  { n: "03", icon: Users, title: "We Build Meaningful Connections", text: "We foster strong relationships and collaboration among alumni across generations, professions, and locations, creating a network of encouragement, partnership, and shared kingdom purpose." },
  { n: "04", icon: Calendar, title: "We Organize Reunions & Programs", text: "We coordinate impactful programs, conferences, and reunions at state, national, and global levels, strengthening unity while celebrating the rich heritage of the fellowship." },
  { n: "05", icon: Heart, title: "We Support the Home Fellowship", text: "We provide strategic, spiritual, and financial support to the undergraduate ECU fellowship at Obafemi Awolowo University, ensuring the continuity of sound teaching, discipleship, and outreach on campus." },
  { n: "06", icon: GraduationCap, title: "We Mentor & Raise Leaders", text: "We promote mentorship and leadership development by connecting experienced alumni with younger members, equipping the next generation of Christian leaders to excel in ministry, business, academia, and public service." },
];

const Index = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<any[]>([]);
  const [currentHeroIdx, setCurrentHeroIdx] = useState(0);
  const heroImages = [hero1, hero2, hero3, hero4];

  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("status", "published").order("created_at", { ascending: false }).limit(3).then(({ data }) => setPosts(data ?? []));
    supabase.from("events").select("*").eq("status", "published").eq("event_status", "upcoming").order("event_date", { ascending: true }).limit(3).then(({ data }) => setEvents(data ?? []));
    supabase.from("gallery_events").select("*").eq("status", "published").order("event_date", { ascending: false }).limit(6).then(({ data }) => setGalleries(data ?? []));

    const timer = setInterval(() => {
      setCurrentHeroIdx((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black">
          {heroImages.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="ECU fellowship in worship"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
                idx === currentHeroIdx ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary/85 to-primary/60" />
        </div>
        <div className="relative container py-24 md:py-36 lg:py-44">
          <div className="max-w-3xl text-primary-foreground">
            <FadeIn direction="up" delay={0.1}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur border border-primary-foreground/20 text-xs font-semibold uppercase tracking-[0.2em] mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" /> Obafemi Awolowo University
              </div>
            </FadeIn>
            <FadeIn direction="up" delay={0.2}>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-6 text-balance">
                Evangelical Christian Union Alumni Fellowship
              </h1>
            </FadeIn>
            <FadeIn direction="up" delay={0.3}>
              <p className="text-lg md:text-xl text-primary-foreground/85 leading-relaxed mb-10 max-w-2xl">
                Preserving the Legacy, Advancing the Kingdom — connecting generations of ECUites to build faith, fellowship, and impact.
              </p>
            </FadeIn>
            <FadeIn direction="up" delay={0.4}>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow">
                  <Link to="/auth?mode=signup">Join Alumni Database <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/donate">Give Here</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/contact">Contact Us</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="container py-20 md:py-28 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <FadeIn direction="right" className="relative">
          <img src={about} alt="ECU alumni fellowship" loading="lazy" width={1280} height={896} className="rounded-2xl shadow-elegant w-full" />
          <div className="absolute -bottom-6 -right-6 bg-accent text-accent-foreground rounded-2xl p-6 shadow-elegant hidden md:block">
            <div className="font-display text-4xl font-bold">Decades</div>
            <div className="text-sm opacity-90">of faith & legacy</div>
          </div>
        </FadeIn>
        <FadeIn direction="left">
          <SectionHeader eyebrow="About ECU" title="A place of the Word and prayer." />
          <div className="mt-6 space-y-4 text-foreground/80 leading-relaxed">
            <p>Evangelical Christian Union (ECU) is one of the oldest Christian fellowships in Obafemi Awolowo University, as old as the university itself. For decades, ECU has raised men and women grounded in the Word, committed to excellence, and passionate about kingdom impact.</p>
            <p>Over the years, the fellowship has been widely known as a place of the Word and prayer — a spiritual home where students are deeply rooted in sound biblical teaching, fervent intercession, and intentional discipleship.</p>
          </div>
          <Button asChild className="mt-8" variant="outline">
            <Link to="/about">Read More <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </FadeIn>
      </section>

      {/* GALLERY PREVIEW */}
      {galleries.length > 0 && (
        <section className="bg-secondary/40 py-20">
          <div className="container">
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <FadeIn direction="up">
                <SectionHeader eyebrow="Moments" title="From recent gatherings" />
              </FadeIn>
              <FadeIn direction="left">
                <Button asChild variant="outline"><Link to="/gallery">View More <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
              </FadeIn>
            </div>
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleries.map((g) => (
                <StaggerItem key={g.id}>
                  <Link to={`/gallery/${g.slug}`} className="group relative aspect-square overflow-hidden rounded-xl bg-muted block h-full">
                    {g.cover_image_url && <img src={g.cover_image_url} alt={g.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-smooth duration-500" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-deep/85 via-primary-deep/20 to-transparent opacity-90" />
                    <div className="absolute bottom-0 p-4 text-primary-foreground w-full">
                      <div className="font-display font-semibold">{g.title}</div>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* WHAT WE DO */}
      <section className="container py-20 md:py-28">
        <FadeIn direction="up">
          <SectionHeader eyebrow="What We Do" title="Six pillars of our calling." align="center" />
        </FadeIn>
        <StaggerContainer className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {whatWeDo.map((item) => (
            <StaggerItem key={item.n}>
              <Card className="p-7 border-border/60 hover:shadow-elegant hover:-translate-y-1 transition-smooth bg-card h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-hero flex items-center justify-center text-primary-foreground shrink-0">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="font-display text-3xl font-bold text-accent leading-none pt-1">{item.n}</div>
                </div>
                <h3 className="font-display text-xl font-semibold mb-3 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <FadeIn direction="up">
        <PartnerCTA />
      </FadeIn>

      {/* BLOG + EVENTS */}
      <section className="container py-20 grid lg:grid-cols-2 gap-12">
        <FadeIn direction="up" delay={0.1}>
          <SectionHeader eyebrow="Latest" title="From the Blog" />
          <StaggerContainer className="mt-8 space-y-5">
            {posts.length === 0 && <p className="text-muted-foreground">No posts published yet.</p>}
            {posts.map((p) => (
              <StaggerItem key={p.id}>
                <Link to={`/blog/${p.slug}`} className="block group">
                  <Card className="p-5 hover:border-primary/40 transition-smooth">
                    {p.category && <div className="text-xs uppercase tracking-wider text-accent font-semibold mb-2">{p.category}</div>}
                    <h3 className="font-display text-xl font-semibold group-hover:text-primary transition-smooth">{p.title}</h3>
                    {p.excerpt && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.excerpt}</p>}
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
        
        <FadeIn direction="up" delay={0.3}>
          <SectionHeader eyebrow="Calendar" title="Upcoming Events" />
          <StaggerContainer className="mt-8 space-y-5">
            {events.length === 0 && <p className="text-muted-foreground">No upcoming events scheduled.</p>}
            {events.map((e) => (
              <StaggerItem key={e.id}>
                <Link to={`/events/${e.slug}`} className="block group">
                  <Card className="p-5 flex gap-4 hover:border-primary/40 transition-smooth">
                    <div className="h-16 w-16 rounded-lg bg-gradient-hero text-primary-foreground flex flex-col items-center justify-center shrink-0">
                      <div className="text-xs uppercase">{e.event_date && new Date(e.event_date).toLocaleString("en", { month: "short" })}</div>
                      <div className="font-display text-2xl font-bold leading-none">{e.event_date && new Date(e.event_date).getDate()}</div>
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-smooth">{e.title}</h3>
                      {e.location && <div className="text-xs text-muted-foreground mt-1">{e.location}</div>}
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </FadeIn>
      </section>
    </Layout>
  );
};

export default Index;
