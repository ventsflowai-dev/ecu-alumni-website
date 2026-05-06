import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="grid lg:grid-cols-2 gap-8">
      <section className="bg-white border rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4">
          {editingId ? "Edit Blog Post" : "Create Blog Post"}
        </h1>

        <form onSubmit={savePost} className="space-y-4">
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
                slug: generateSlug(e.target.value),
              })
            }
          />

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Featured Image
            </label>

            <input
              type="file"
              accept="image/*"
              className="w-full border rounded-lg p-3"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFeaturedImage(file);
              }}
            />

            {uploading && (
              <p className="text-sm text-slate-500 mt-2">Uploading image...</p>
            )}

            {form.featured_image_url && (
              <img
                src={form.featured_image_url}
                alt="Featured preview"
                className="mt-3 h-40 w-full object-cover rounded-lg border"
              />
            )}
          </div>

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />

          <textarea
            className="w-full border rounded-lg p-3"
            placeholder="Excerpt"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />

          <textarea
            className="w-full border rounded-lg p-3 min-h-40"
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />

          <select
            className="w-full border rounded-lg p-3"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "draft" | "published",
              })
            }
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-950 text-white px-5 py-3 rounded-lg disabled:opacity-50"
            >
              {editingId ? "Update Post" : "Create Post"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-slate-100 px-5 py-3 rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Blog Posts</h2>

        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border rounded-xl p-4">
              {post.featured_image_url && (
                <img
                  src={post.featured_image_url}
                  alt={post.title}
                  className="h-32 w-full object-cover rounded-lg mb-3"
                />
              )}

              <h3 className="font-semibold">{post.title}</h3>

              <p className="text-sm text-slate-500">
                {post.category} • {post.status}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => editPost(post)}
                  className="px-3 py-2 bg-slate-100 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deletePost(post.id!)}
                  className="px-3 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}