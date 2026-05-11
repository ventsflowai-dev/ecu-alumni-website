import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Edit, Trash2, Megaphone, Loader2 } from "lucide-react";

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
  const [saving, setSaving] = useState(false);

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
    setSaving(true);

    if (editingId) {
      await supabase.from("announcements").update(form).eq("id", editingId);
    } else {
      await supabase.from("announcements").insert(form);
    }

    setSaving(false);
    setForm(emptyForm);
    setEditingId(null);
    loadAnnouncements();
  }

  async function deleteAnnouncement(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    loadAnnouncements();
  }

  function cancelEdit() {
    setForm(emptyForm);
    setEditingId(null);
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="lg:col-span-5">
        <Card className="border-slate-200/60 shadow-sm sticky top-6">
          <CardHeader>
            <CardTitle className="text-xl font-display">
              {editingId ? "Edit Announcement" : "Create Announcement"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveAnnouncement} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter announcement title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your announcement here..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="min-h-[200px]"
                  required
                />
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

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="submit" disabled={saving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {editingId ? "Update" : "Create"}
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

      <section className="lg:col-span-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-slate-900">All Announcements</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">{announcements.length} Total</Badge>
        </div>

        <div className="space-y-4">
          {announcements.map((item) => (
            <Card key={item.id} className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
              <CardContent className="p-5">
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="font-semibold text-lg text-slate-900">{item.title}</h3>
                  <Badge variant={item.status === "published" ? "default" : "secondary"} className="shrink-0">
                    {item.status}
                  </Badge>
                </div>
                
                <p className="text-slate-600 text-sm whitespace-pre-wrap mb-5">
                  {item.message}
                </p>

                <div className="flex gap-2 border-t border-slate-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm(item);
                      setEditingId(item.id || null);
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 mr-2" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteAnnouncement(item.id!)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <Megaphone className="h-8 w-8 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No announcements found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}