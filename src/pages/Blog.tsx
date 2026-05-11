import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("status", "published").order("created_at", { ascending: false }).then(({ data }) => setPosts(data ?? []));
  }, []);

  return (
    <Layout>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container py-20 md:py-24">
          <FadeIn direction="up" delay={0.1}>
            <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-3">Blog & News</div>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <h1 className="font-display text-4xl md:text-6xl font-bold">Stories from our fellowship</h1>
          </FadeIn>
        </div>
      </section>

      <section className="container py-16">
        {posts.length === 0 ? (
          <FadeIn direction="up">
            <p className="text-muted-foreground text-center py-20">No blog posts published yet.</p>
          </FadeIn>
        ) : (
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <StaggerItem key={p.id}>
                <Link to={`/blog/${p.slug}`} className="group block h-full">
                  <Card className="overflow-hidden h-full hover:shadow-elegant hover:-translate-y-1 transition-smooth">
                    <div className="aspect-[16/10] bg-secondary overflow-hidden">
                      {p.featured_image_url ? (
                        <img src={p.featured_image_url} alt={p.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-smooth duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-hero" />
                      )}
                    </div>
                    <div className="p-6">
                      {p.category && <div className="text-xs uppercase tracking-wider text-accent font-semibold mb-2">{p.category}</div>}
                      <h2 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-smooth">{p.title}</h2>
                      {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{p.excerpt}</p>}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </section>
    </Layout>
  );
};

export default Blog;
