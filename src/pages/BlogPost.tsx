import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ArrowLeft } from "lucide-react";
import { Loader2 } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("slug", slug).eq("status", "published").maybeSingle().then(({ data }) => {
      setPost(data); setLoading(false);
    });
  }, [slug]);

  if (loading) return <Layout><div className="container py-32 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></Layout>;
  if (!post) return <Layout><div className="container py-32 text-center"><h1 className="font-display text-3xl">Post not found</h1><Link to="/blog" className="text-primary mt-4 inline-block">← Back to blog</Link></div></Layout>;

  return (
    <Layout>
      <article className="container max-w-3xl py-16">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8"><ArrowLeft className="h-4 w-4" />Back to blog</Link>
        {post.category && <div className="text-xs uppercase tracking-wider text-accent font-semibold mb-3">{post.category}</div>}
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-balance">{post.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        {post.featured_image_url && <img src={post.featured_image_url} alt={post.title} className="w-full rounded-2xl mb-10 shadow-card" />}
        <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/80">
          {post.content?.split("\n").map((para: string, i: number) => para.trim() && <p key={i}>{para}</p>)}
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
