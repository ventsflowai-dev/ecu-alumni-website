import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type EventItem = {
  id?: string;
  title: string;
  slug: string;
  event_date: string;
  event_time: string;
  location: string;
  short_description: string;
  full_description: string;
  featured_image_url: string;
  event_status: "upcoming" | "past";
  status: "draft" | "published";
  registration_link: string;
};

const EVENT_BUCKET = "event-images";

const emptyForm: EventItem = {
  title: "",
  slug: "",
  event_date: "",
  event_time: "",
  location: "",
  short_description: "",
  full_description: "",
  featured_image_url: "",
  event_status: "upcoming",
  status: "draft",
  registration_link: "",
};

export default function CMSEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState<EventItem>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (!error) setEvents(data || []);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function uploadEventImage(file: File) {
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `events/${fileName}`;

    const { error } = await supabase.storage
      .from(EVENT_BUCKET)
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

    const { data } = supabase.storage.from(EVENT_BUCKET).getPublicUrl(filePath);

    setForm((prev) => ({
      ...prev,
      featured_image_url: data.publicUrl,
    }));
  }

  async function saveEvent(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      ...form,
      slug: form.slug || generateSlug(form.title),
    };

    if (editingId) {
      await supabase.from("events").update(payload).eq("id", editingId);
    } else {
      await supabase.from("events").insert(payload);
    }

    setForm(emptyForm);
    setEditingId(null);
    loadEvents();
  }

  async function deleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;

    await supabase.from("events").delete().eq("id", id);
    loadEvents();
  }

  function editEvent(event: EventItem) {
    setForm(event);
    setEditingId(event.id || null);
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <section className="bg-white border rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4">
          {editingId ? "Edit Event" : "Create Event"}
        </h1>

        <form onSubmit={saveEvent} className="space-y-4">
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Event Title"
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

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="date"
              className="w-full border rounded-lg p-3"
              value={form.event_date}
              onChange={(e) =>
                setForm({ ...form, event_date: e.target.value })
              }
            />

            <input
              type="time"
              className="w-full border rounded-lg p-3"
              value={form.event_time}
              onChange={(e) =>
                setForm({ ...form, event_time: e.target.value })
              }
            />
          </div>

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Event Image
            </label>

            <input
              type="file"
              accept="image/*"
              className="w-full border rounded-lg p-3"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadEventImage(file);
              }}
            />

            {uploading && (
              <p className="text-sm text-slate-500 mt-2">Uploading image...</p>
            )}

            {form.featured_image_url && (
              <img
                src={form.featured_image_url}
                alt="Event preview"
                className="mt-3 h-40 w-full object-cover rounded-lg border"
              />
            )}
          </div>

          <textarea
            className="w-full border rounded-lg p-3"
            placeholder="Short Description"
            value={form.short_description}
            onChange={(e) =>
              setForm({ ...form, short_description: e.target.value })
            }
          />

          <textarea
            className="w-full border rounded-lg p-3 min-h-40"
            placeholder="Full Description"
            value={form.full_description}
            onChange={(e) =>
              setForm({ ...form, full_description: e.target.value })
            }
          />

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Registration Link (optional)"
            value={form.registration_link}
            onChange={(e) =>
              setForm({ ...form, registration_link: e.target.value })
            }
          />

          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="w-full border rounded-lg p-3"
              value={form.event_status}
              onChange={(e) =>
                setForm({
                  ...form,
                  event_status: e.target.value as "upcoming" | "past",
                })
              }
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>

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
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="bg-blue-950 text-white px-5 py-3 rounded-lg disabled:opacity-50"
            >
              {editingId ? "Update Event" : "Create Event"}
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
        <h2 className="text-xl font-bold mb-4">Events</h2>

        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="bg-white border rounded-xl p-4">
              {event.featured_image_url && (
                <img
                  src={event.featured_image_url}
                  alt={event.title}
                  className="h-32 w-full object-cover rounded-lg mb-3"
                />
              )}

              <h3 className="font-semibold">{event.title}</h3>

              <p className="text-sm text-slate-500">
                {event.event_date} • {event.location}
              </p>

              <p className="text-sm text-slate-500">
                {event.event_status} • {event.status}
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => editEvent(event)}
                  className="px-3 py-2 bg-slate-100 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteEvent(event.id!)}
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