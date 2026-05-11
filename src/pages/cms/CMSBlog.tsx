import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Save, X, Edit, Trash2, FileText } from "lucide-react";

type BlogPost = {
  id?: string;
  title: string;
  slug: string;
  featured_image_url: string;
  excerpt: string;
  content: string;
  category: string;
  status: "draft" | "published";
};

const BLOG_BUCKET = "blog-images";

const emptyForm: BlogPost = {
  title: "",
  slug: "",
  featured_image_url: "",
  excerpt: "",
  content: "",
  category: "Uncategorized",
  status: "draft",
};

export default function CMSBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<BlogPost>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setPosts(data || []);
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function uploadFeaturedImage(file: File) {
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `blog/${fileName}`;

    const { error } = await supabase.storage
      .from(BLOG_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploading(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const { data } = supabase.storage.from(BLOG_BUCKET).getPublicUrl(filePath);

    setForm((prev) => ({
      ...prev,
      featured_image_url: data.publicUrl,
    }));
  }

  async function savePost(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      ...form,
      slug: form.slug || generateSlug(form.title),
    };

    if (editingId) {
      await supabase.from("blog_posts").update(payload).eq("id", editingId);
    } else {
      await supabase.from("blog_posts").insert(payload);
    }

    setForm(emptyForm);
    setEditingId(null);
    loadPosts();
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    loadPosts();
  }

  function editPost(post: BlogPost) {
    setForm(post);
    setEditingId(post.id || null);
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="lg:col-span-7">
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-display">
              {editingId ? "Edit Blog Post" : "Create Blog Post"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePost} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter post title"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="post-url-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Featured Image</Label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('featured_image')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Image"}
                  </Button>
                  <input
                    id="featured_image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadFeaturedImage(file);
                    }}
                  />
                </div>
                {form.featured_image_url && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative aspect-video">
                    <img
                      src={form.featured_image_url}
                      alt="Featured preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. Technology, Campus News"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="A short summary of the post..."
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Write the full post content here..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="min-h-[200px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: "draft" | "published") => setForm({ ...form, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? "Update Post" : "Publish Post"}
                </Button>

                {editingId && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="lg:col-span-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-slate-900">Recent Posts</h2>
          <Badge variant="secondary">{posts.length} Total</Badge>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
              {post.featured_image_url && (
                <div className="h-32 w-full overflow-hidden bg-slate-100">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-semibold text-slate-900 line-clamp-2">{post.title}</h3>
                  <Badge variant={post.status === "published" ? "default" : "secondary"} className="shrink-0">
                    {post.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-slate-500 mb-4">{post.category}</p>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => editPost(post)}>
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" className="w-full" onClick={() => deletePost(post.id!)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <FileText className="h-8 w-8 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No blog posts found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}