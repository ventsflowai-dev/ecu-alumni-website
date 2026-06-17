import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Save, X, Edit, Trash2, Calendar, MapPin, Clock } from "lucide-react";
import { ImageSelector } from "@/components/admin/ImageSelector";

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
    <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="lg:col-span-7">
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-display">
              {editingId ? "Edit Event" : "Create Event"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveEvent} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="Enter event title"
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
                  placeholder="event-url-slug"
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
                  <Label htmlFor="event_time">Time</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={form.event_time}
                    onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Where is the event taking place?"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Event Image</Label>
                <ImageSelector
                  bucketName={EVENT_BUCKET}
                  folderPath="events"
                  currentImageUrl={form.featured_image_url}
                  onImageSelected={(url) => setForm({ ...form, featured_image_url: url })}
                  buttonText="Select Image"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea
                  id="short_description"
                  placeholder="A brief summary for cards..."
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_description">Full Description</Label>
                <Textarea
                  id="full_description"
                  placeholder="Write the full event details here..."
                  value={form.full_description}
                  onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_link">Registration Link (optional)</Label>
                <Input
                  id="registration_link"
                  type="url"
                  placeholder="https://..."
                  value={form.registration_link}
                  onChange={(e) => setForm({ ...form, registration_link: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_status">Event Timing</Label>
                  <Select
                    value={form.event_status}
                    onValueChange={(value: "upcoming" | "past") => setForm({ ...form, event_status: value })}
                  >
                    <SelectTrigger id="event_status">
                      <SelectValue placeholder="Select timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
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
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="submit" disabled={uploading} className="bg-purple-600 hover:bg-purple-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? "Update Event" : "Create Event"}
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
          <h2 className="text-xl font-display font-bold text-slate-900">All Events</h2>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">{events.length} Total</Badge>
        </div>

        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
              {event.featured_image_url && (
                <div className="h-32 w-full overflow-hidden bg-slate-100">
                  <img
                    src={event.featured_image_url}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-semibold text-slate-900 line-clamp-2">{event.title}</h3>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Badge variant={event.status === "published" ? "default" : "secondary"}>
                      {event.status}
                    </Badge>
                    <Badge variant="outline" className={event.event_status === "upcoming" ? "text-green-600 border-green-200" : ""}>
                      {event.event_status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1 mt-3 mb-4">
                  <div className="flex items-center text-sm text-slate-500">
                    <Calendar className="h-3.5 w-3.5 mr-2" />
                    {event.event_date}
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock className="h-3.5 w-3.5 mr-2" />
                    {event.event_time}
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5 mr-2" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => editEvent(event)}>
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" className="w-full" onClick={() => deleteEvent(event.id!)}>
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {events.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <Calendar className="h-8 w-8 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No events found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}