import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Save, X, Edit, Trash2, Heart, DollarSign, Target, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ImageSelector } from "@/components/admin/ImageSelector";

type Campaign = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  featured_image_url: string;
  target_amount: number | null;
  amount_raised: number;
  suggested_amounts: string;
  status: "active" | "inactive";
};

const CAMPAIGN_BUCKET = "campaign-images";

const emptyForm: Campaign = {
  title: "",
  slug: "",
  description: "",
  featured_image_url: "",
  target_amount: null,
  amount_raised: 0,
  suggested_amounts: "5000,10000,20000,50000",
  status: "active",
};

export default function CMSDonationCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [form, setForm] = useState<Campaign>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadCampaigns() {
    const { data, error } = await supabase
      .from("donation_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setCampaigns((data as any) || []);
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  async function saveCampaign(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      ...form,
      slug: form.slug || generateSlug(form.title),
      suggested_amounts: form.suggested_amounts
        .split(",")
        .map((amount) => Number(amount.trim()))
        .filter(Boolean),
    };

    if (editingId) {
      await supabase
        .from("donation_campaigns")
        .update(payload as any)
        .eq("id", editingId);
    } else {
      await supabase.from("donation_campaigns").insert(payload as any);
    }

    setForm(emptyForm);
    setEditingId(null);
    loadCampaigns();
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Delete this campaign?")) return;
    await supabase.from("donation_campaigns").delete().eq("id", id);
    loadCampaigns();
  }

  function editCampaign(campaign: any) {
    setForm({
      ...campaign,
      suggested_amounts: Array.isArray(campaign.suggested_amounts)
        ? campaign.suggested_amounts.join(",")
        : campaign.suggested_amounts || "",
    });
    setEditingId(campaign.id || null);
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
              {editingId ? "Edit Campaign" : "Create Campaign"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveCampaign} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  placeholder="Enter campaign title"
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
                  placeholder="campaign-url-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell people why they should donate..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-[150px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Campaign Image</Label>
                <ImageSelector
                  bucketName={CAMPAIGN_BUCKET}
                  folderPath="campaigns"
                  currentImageUrl={form.featured_image_url}
                  onImageSelected={(url) => setForm({ ...form, featured_image_url: url })}
                  buttonText="Select Image"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Target Amount (₦)</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 sm:text-sm">₦</span>
                    </div>
                    <Input
                      id="target_amount"
                      type="number"
                      className="pl-7"
                      placeholder="e.g. 1000000"
                      value={form.target_amount ?? ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          target_amount: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suggested_amounts">Suggested Amounts (Comma separated)</Label>
                  <Input
                    id="suggested_amounts"
                    placeholder="e.g. 5000,10000,20000"
                    value={form.suggested_amounts}
                    onChange={(e) => setForm({ ...form, suggested_amounts: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value: "active" | "inactive") => setForm({ ...form, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <Button type="submit" disabled={uploading} className="bg-teal-600 hover:bg-teal-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? "Update Campaign" : "Create Campaign"}
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
          <h2 className="text-xl font-display font-bold text-slate-900">Donation Campaigns</h2>
          <Badge variant="secondary" className="bg-teal-100 text-teal-700">{campaigns.length} Total</Badge>
        </div>

        <div className="space-y-4">
          {campaigns.map((campaign: any) => {
            const raised = Number(campaign.amount_raised || 0);
            const target = Number(campaign.target_amount || 0);
            const progress = target > 0 ? Math.min((raised / target) * 100, 100) : 0;

            return (
              <Card key={campaign.id} className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
                {campaign.featured_image_url && (
                  <div className="h-32 w-full overflow-hidden bg-slate-100">
                    <img
                      src={campaign.featured_image_url}
                      alt={campaign.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-2">{campaign.title}</h3>
                    <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="shrink-0">
                      {campaign.status}
                    </Badge>
                  </div>

                  <div className="space-y-3 mt-4 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-teal-600 font-semibold flex items-center">
                        <DollarSign className="h-3.5 w-3.5 mr-0.5" />
                        ₦{raised.toLocaleString()} raised
                      </span>
                      {target > 0 && (
                        <span className="text-slate-500 flex items-center">
                          <Target className="h-3.5 w-3.5 mr-1" />
                          Target: ₦{target.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {target > 0 && (
                      <Progress value={progress} className="h-2" />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="w-full" onClick={() => editCampaign(campaign)}>
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="w-full" onClick={() => deleteCampaign(campaign.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {campaigns.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <Heart className="h-8 w-8 mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No donation campaigns found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}