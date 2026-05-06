import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type EventItem = {
  id: string;
  title: string;
  event_date: string;
  location: string;
  featured_image_url: string;
};

type GalleryEvent = {
  id?: string;
  event_id?: string | null;
  title: string;
  slug: string;
  event_date: string;
  description: string;
  location: string;
  cover_image_url: string;
  status: "draft" | "published";
};

type GalleryImage = {
  id?: string;
  gallery_event_id: string;
  image_url: string;
  caption: string;
};

const GALLERY_BUCKET = "gallery-images";

const emptyGalleryForm: GalleryEvent = {
  event_id: null,
  title: "",
  slug: "",
  event_date: "",
  description: "",
  location: "",
  cover_image_url: "",
  status: "draft",
};

export default function CMSGallery() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [galleryEvents, setGalleryEvents] = useState<GalleryEvent[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [form, setForm] = useState<GalleryEvent>(emptyGalleryForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [selectedGalleryTitle, setSelectedGalleryTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadEvents();
    loadGalleryEvents();
  }, []);

  async function loadEvents() {
    const { data, error } = await supabase
      .from("events")
      .select("id, title, event_date, location, featured_image_url")
      .order("event_date", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setEvents(data || []);
  }

  async function loadGalleryEvents() {
    const { data, error } = await supabase
      .from("gallery_events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setGalleryEvents((data || []) as unknown as GalleryEvent[]);
  }

  async function loadGalleryImages(galleryEventId: string) {
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("gallery_event_id", galleryEventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setGalleryImages(data || []);
  }

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  function handleEventSelect(eventId: string) {
    if (eventId === "standalone") {
      setForm({
        ...form,
        event_id: null,
        cover_image_url: "",
      });
      return;
    }

    const event = events.find((item) => item.id === eventId);

    setForm({
      ...form,
      event_id: eventId,
      title: event?.title || form.title,
      slug: event?.title ? generateSlug(event.title) : form.slug,
      event_date: event?.event_date || form.event_date,
      location: event?.location || form.location,
      cover_image_url: event?.featured_image_url || form.cover_image_url,
    });
  }

  async function uploadCoverImage(file: File) {
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(filePath, file);

    setUploading(false);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(filePath);

    setForm((prev) => ({
      ...prev,
      cover_image_url: data.publicUrl,
    }));
  }

  async function uploadImagesToAlbum(galleryEventId: string, files: File[]) {
    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `gallery/${galleryEventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(GALLERY_BUCKET)
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        alert(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("gallery_images").insert({
        gallery_event_id: galleryEventId,
        image_url: data.publicUrl,
        caption,
      });

      if (insertError) {
        console.error(insertError);
        alert(insertError.message);
      }
    }
  }

  async function saveGalleryEvent(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    const payload = {
      event_id: form.event_id || null,
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      event_date: form.event_date,
      description: form.description,
      location: form.location,
      cover_image_url: form.cover_image_url,
      status: form.status,
    };

    if (editingId) {
      const { error } = await supabase
        .from("gallery_events")
        .update(payload as any)
        .eq("id", editingId);

      if (error) {
        setUploading(false);
        alert(error.message);
        return;
      }

      if (pendingImages.length > 0) {
        await uploadImagesToAlbum(editingId, pendingImages);
      }
    } else {
      const { data, error } = await supabase
        .from("gallery_events")
        .insert(payload as any)
        .select("id")
        .single();

      if (error) {
        setUploading(false);
        alert(error.message);
        return;
      }

      if (data?.id && pendingImages.length > 0) {
        await uploadImagesToAlbum(data.id, pendingImages);
      }
    }

    setUploading(false);
    setForm(emptyGalleryForm);
    setEditingId(null);
    setPendingImages([]);
    setCaption("");
    loadGalleryEvents();

    if (selectedGalleryId) {
      loadGalleryImages(selectedGalleryId);
    }
  }

  async function deleteGalleryEvent(id: string) {
    if (!confirm("Delete this gallery album?")) return;

    await supabase.from("gallery_images").delete().eq("gallery_event_id", id);
    await supabase.from("gallery_events").delete().eq("id", id);

    if (selectedGalleryId === id) {
      setSelectedGalleryId(null);
      setSelectedGalleryTitle("");
      setGalleryImages([]);
    }

    loadGalleryEvents();
  }

  async function deleteGalleryImage(id: string) {
    if (!confirm("Delete this image?")) return;

    await supabase.from("gallery_images").delete().eq("id", id);

    if (selectedGalleryId) {
      loadGalleryImages(selectedGalleryId);
    }
  }

  function editGalleryEvent(item: GalleryEvent) {
    setForm({
      ...item,
      event_id: item.event_id || null,
    });
    setEditingId(item.id || null);
  }

  function selectGallery(item: GalleryEvent) {
    setSelectedGalleryId(item.id!);
    setSelectedGalleryTitle(item.title);
    loadGalleryImages(item.id!);
  }

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <section className="bg-white border rounded-xl p-6">
          <h1 className="text-xl font-bold mb-4">
            {editingId ? "Edit Gallery Album" : "Create Gallery Album"}
          </h1>

          <form onSubmit={saveGalleryEvent} className="space-y-4">
            <select
              className="w-full border rounded-lg p-3"
              value={form.event_id || "standalone"}
              onChange={(e) => handleEventSelect(e.target.value)}
            >
              <option value="standalone">Standalone Gallery</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} {event.event_date ? `(${event.event_date})` : ""}
                </option>
              ))}
            </select>

            <input
              className="w-full border rounded-lg p-3"
              placeholder="Gallery Title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                  slug: generateSlug(e.target.value),
                })
              }
              required
            />

            <input
              className="w-full border rounded-lg p-3"
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />

            <input
              type="date"
              className="w-full border rounded-lg p-3"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            />

            <input
              className="w-full border rounded-lg p-3"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <textarea
              className="w-full border rounded-lg p-3 min-h-32"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {!form.event_id && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cover Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  className="w-full border rounded-lg p-3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadCoverImage(file);
                  }}
                />
              </div>
            )}

            {form.cover_image_url && (
              <img
                src={form.cover_image_url}
                alt="Cover preview"
                className="h-40 w-full object-cover rounded-lg border"
              />
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Gallery Images
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                className="w-full border rounded-lg p-3"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) setPendingImages(Array.from(files));
                }}
              />

              {pendingImages.length > 0 && (
                <p className="text-sm text-slate-500 mt-2">
                  {pendingImages.length} image(s) selected
                </p>
              )}
            </div>

            <input
              className="w-full border rounded-lg p-3"
              placeholder="Caption for selected images"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
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

            <button
              disabled={uploading}
              className="bg-blue-950 text-white px-5 py-3 rounded-lg disabled:opacity-50"
            >
              {uploading
                ? "Saving..."
                : editingId
                ? "Update Album"
                : "Create Album"}
            </button>
          </form>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Gallery Albums</h2>

          <div className="space-y-3">
            {galleryEvents.map((item) => (
              <div key={item.id} className="bg-white border rounded-xl p-4">
                {item.cover_image_url && (
                  <img
                    src={item.cover_image_url}
                    alt={item.title}
                    className="h-32 w-full object-cover rounded-lg mb-3"
                  />
                )}

                <h3 className="font-semibold">{item.title}</h3>

                <p className="text-sm text-slate-500">
                  {item.event_date || "No date"} • {item.status}
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => selectGallery(item)}
                    className="px-3 py-2 bg-blue-950 text-white rounded"
                  >
                    View Images
                  </button>

                  <button
                    onClick={() => editGalleryEvent(item)}
                    className="px-3 py-2 bg-slate-100 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteGalleryEvent(item.id!)}
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

      {selectedGalleryId && (
        <section className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-1">Gallery Images</h2>
          <p className="text-sm text-slate-500 mb-4">
            Album: {selectedGalleryTitle}
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            {galleryImages.map((image) => (
              <div key={image.id} className="border rounded-xl p-3">
                <img
                  src={image.image_url}
                  alt={image.caption || "Gallery image"}
                  className="h-32 w-full object-cover rounded-lg"
                />

                {image.caption && (
                  <p className="text-sm mt-2 text-slate-600">{image.caption}</p>
                )}

                <button
                  onClick={() => deleteGalleryImage(image.id!)}
                  className="mt-3 px-3 py-2 bg-red-600 text-white rounded w-full"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}