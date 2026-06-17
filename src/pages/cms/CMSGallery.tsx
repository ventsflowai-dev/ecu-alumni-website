import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Save, Edit, Trash2, Calendar, MapPin, Eye, ImageIcon, Loader2 } from "lucide-react";
import { ImageSelector } from "@/components/admin/ImageSelector";

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid lg:grid-cols-12 gap-8">
        <section className="lg:col-span-6">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-display">
                {editingId ? "Edit Gallery Album" : "Create Gallery Album"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveGalleryEvent} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="event_id">Link to Event</Label>
                  <Select
                    value={form.event_id || "standalone"}
                    onValueChange={handleEventSelect}
                  >
                    <SelectTrigger id="event_id">
                      <SelectValue placeholder="Select an event" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standalone">Standalone Gallery</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} {event.event_date ? `(${event.event_date})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Gallery Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter gallery title"
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="gallery-url-slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Date</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Main Auditorium"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="A short description of this album..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {!form.event_id ? (
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <ImageSelector
                      bucketName={GALLERY_BUCKET}
                      folderPath="covers"
                      currentImageUrl={form.cover_image_url}
                      onImageSelected={(url) => setForm({ ...form, cover_image_url: url })}
                      buttonText="Select Cover Image"
                    />
                  </div>
                ) : (
                  form.cover_image_url && (
                    <div className="space-y-2">
                      <Label>Cover Image Preview</Label>
                      <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative aspect-video">
                        <img
                          src={form.cover_image_url}
                          alt="Cover preview"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <div className="space-y-2">
                    <Label className="text-blue-700 font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" /> Add Album Images
                    </Label>
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => document.getElementById('album_images')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Select Images
                      </Button>
                      <input
                        id="album_images"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files) setPendingImages(Array.from(files));
                        }}
                      />
                      {pendingImages.length > 0 && (
                        <span className="text-sm font-medium text-slate-700 bg-white px-3 py-1 rounded-full border shadow-sm">
                          {pendingImages.length} selected
                        </span>
                      )}
                    </div>
                  </div>

                  {pendingImages.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="caption">Caption for these images</Label>
                      <Input
                        id="caption"
                        placeholder="Optional caption applied to all selected images"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Publish Status</Label>
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

                <div className="pt-4 border-t border-slate-100">
                  <Button type="submit" disabled={uploading} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {uploading
                      ? "Saving Album..."
                      : editingId
                      ? "Update Album"
                      : "Create Album"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <section className="lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-slate-900">Gallery Albums</h2>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">{galleryEvents.length} Total</Badge>
          </div>

          <div className="space-y-4">
            {galleryEvents.map((item) => (
              <Card key={item.id} className={`overflow-hidden border-slate-200/60 shadow-sm transition-all group ${selectedGalleryId === item.id ? 'ring-2 ring-orange-500 shadow-md' : 'hover:shadow-md'}`}>
                <div className="flex flex-col sm:flex-row h-full">
                  {item.cover_image_url && (
                    <div className="w-full sm:w-48 h-40 sm:h-auto shrink-0 bg-slate-100">
                      <img
                        src={item.cover_image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="font-semibold text-slate-900 line-clamp-2">{item.title}</h3>
                        <Badge variant={item.status === "published" ? "default" : "secondary"} className="shrink-0">
                          {item.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 mb-4">
                        <div className="flex items-center text-sm text-slate-500">
                          <Calendar className="h-3.5 w-3.5 mr-2" />
                          {item.event_date || "No date"}
                        </div>
                        {item.location && (
                          <div className="flex items-center text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5 mr-2" />
                            {item.location}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => selectGallery(item)} className="bg-slate-900 hover:bg-slate-800">
                        <Eye className="h-3.5 w-3.5 mr-2" />
                        View Images
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => editGalleryEvent(item)}>
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteGalleryEvent(item.id!)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
            {galleryEvents.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No albums found.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {selectedGalleryId && (
        <section className="bg-white border rounded-xl p-6 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ImageIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-900">Images</h2>
              <p className="text-sm text-slate-500 font-medium">Album: {selectedGalleryTitle}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {galleryImages.length} Images
            </Badge>
          </div>

          {galleryImages.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-sm text-slate-500">No images in this album yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {galleryImages.map((image) => (
                <div key={image.id} className="group relative rounded-xl overflow-hidden bg-slate-100 aspect-square shadow-sm border border-slate-200">
                  <img
                    src={image.image_url}
                    alt={image.caption || "Gallery image"}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    {image.caption && (
                      <p className="text-xs text-white line-clamp-2 mb-2">{image.caption}</p>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full h-8"
                      onClick={() => deleteGalleryImage(image.id!)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}