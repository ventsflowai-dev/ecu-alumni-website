import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MapPin, Briefcase, GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import hero2 from "/assets/hero2.jpg";

const Directory = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("profiles")
      .select("id,full_name,email,phone,graduation_year,department,faculty,profession,current_city,current_country,profile_photo_url,bio,show_email_publicly,show_phone_publicly,subgroups")
      .eq("status", "approved").eq("directory_consent", true)
      .order("full_name")
      .then(({ data }) => setMembers(data ?? []));
  }, []);

  const filtered = members.filter((m) => {
    const s = q.toLowerCase();
    return !s || [m.full_name, m.department, m.faculty, m.profession, m.current_city, m.current_country, String(m.graduation_year ?? ""), m.subgroups]
      .some((v) => v?.toLowerCase().includes(s));
  });

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
          <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-3">Alumni Directory</div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">Connecting generations of ECUites</h1>
          <p className="text-lg text-primary-foreground/85 max-w-2xl">Discover and connect with alumni across professions, cities, and decades.</p>
        </div>
      </section>

      <section className="container py-12">
        <div className="relative max-w-xl mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, year, department, profession, city…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10 h-12" />
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-16">No approved alumni profiles yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((m) => (
              <Card key={m.id} className="p-6 text-center hover:shadow-elegant transition-smooth">
                <Avatar className="h-20 w-20 mx-auto mb-4 ring-2 ring-accent/20">
                  <AvatarImage src={m.profile_photo_url} />
                  <AvatarFallback className="bg-gradient-hero text-primary-foreground font-display">
                    {m.full_name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-display text-lg font-bold mb-1">{m.full_name}</h3>
                {m.graduation_year && <div className="text-xs text-accent font-semibold mb-3">Class of {m.graduation_year}</div>}
               <ul className="text-xs text-muted-foreground space-y-1.5">
  {m.department && (
    <li className="flex items-center justify-center gap-1.5">
      <GraduationCap className="h-3 w-3" />
      {m.department}
    </li>
  )}

  {m.profession && (
    <li className="flex items-center justify-center gap-1.5">
      <Briefcase className="h-3 w-3" />
      {m.profession}
    </li>
  )}

  {(m.current_city || m.current_country) && (
    <li className="flex items-center justify-center gap-1.5">
      <MapPin className="h-3 w-3" />
      {[m.current_city, m.current_country].filter(Boolean).join(", ")}
    </li>
  )}

  {m.show_email_publicly && m.email && (
    <li className="flex items-center justify-center gap-1.5">
      Email: {m.email}
    </li>
  )}

  {m.show_phone_publicly && m.phone && (
    <li className="flex items-center justify-center gap-1.5">
      Phone: {m.phone}
    </li>
  )}
</ul>
                {m.subgroups && (
                  <div className="flex flex-wrap justify-center gap-1 mt-4 pt-4 border-t border-border/50">
                    {m.subgroups.split(",").map((s: string) => s.trim()).filter(Boolean).map((sub: string) => (
                      <Badge key={sub} variant="secondary" className="text-[10px] py-0.5 px-2 font-medium bg-secondary/80 text-muted-foreground border-none">
                        {sub}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Directory;
