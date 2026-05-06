import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Announcement = {
  id?: string;
  title: string;
  message: string;
  status: "draft" | "published";
};

const emptyForm: Announcement = {
  title: "",
  message: "",
  status: "draft",
};

export default function CMSAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState<Announcement>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadAnnouncements() {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setAnnouncements(data || []);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function saveAnnouncement(e: React.FormEvent) {
    e.preventDefault();

    if (editingId) {
      await supabase.from("announcements").update(form).eq("id", editingId);
    } else {
      await supabase.from("announcements").insert(form);
    }

    setForm(emptyForm);
    setEditingId(null);
    loadAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    loadAnnouncements();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <section className="bg-white border rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4">
          {editingId ? "Edit Announcement" : "Create Announcement"}
        </h1>

        <form onSubmit={saveAnnouncement} className="space-y-4">
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            className="w-full border rounded-lg p-3 min-h-40"
            placeholder="Message"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
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

          <button className="bg-blue-950 text-white px-5 py-3 rounded-lg">
            {editingId ? "Update Announcement" : "Create Announcement"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Announcements</h2>

        <div className="space-y-3">
          {announcements.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl p-4">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-slate-500">{item.status}</p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setForm(item);
                    setEditingId(item.id || null);
                  }}
                  className="px-3 py-2 bg-slate-100 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteAnnouncement(item.id!)}
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