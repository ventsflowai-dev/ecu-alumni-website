import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  async function uploadCampaignImage(file: File) {
    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
    const filePath = `campaigns/${fileName}`;

    const { error } = await supabase.storage
      .from(CAMPAIGN_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploading(false);

    if (error) {
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from(CAMPAIGN_BUCKET)
      .getPublicUrl(filePath);

    setForm((prev) => ({
      ...prev,
      featured_image_url: data.publicUrl,
    }));
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

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <section className="bg-white border rounded-xl p-6">
        <h1 className="text-xl font-bold mb-4">
          {editingId ? "Edit Campaign" : "Create Campaign"}
        </h1>

        <form onSubmit={saveCampaign} className="space-y-4">
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Campaign Title"
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

          <textarea
            className="w-full border rounded-lg p-3 min-h-32"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Campaign Image
            </label>

            <input
              type="file"
              accept="image/*"
              className="w-full border rounded-lg p-3"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadCampaignImage(file);
              }}
            />

            {uploading && (
              <p className="text-sm text-slate-500 mt-2">Uploading image...</p>
            )}

            {form.featured_image_url && (
              <img
                src={form.featured_image_url}
                alt="Campaign preview"
                className="mt-3 h-40 w-full object-cover rounded-lg border"
              />
            )}
          </div>

          <input
            type="number"
            className="w-full border rounded-lg p-3"
            placeholder="Target Amount"
            value={form.target_amount ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                target_amount: e.target.value ? Number(e.target.value) : null,
              })
            }
          />

          <input
            className="w-full border rounded-lg p-3"
            placeholder="Suggested Amounts e.g. 5000,10000,20000"
            value={form.suggested_amounts}
            onChange={(e) =>
              setForm({ ...form, suggested_amounts: e.target.value })
            }
          />

          <select
            className="w-full border rounded-lg p-3"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "active" | "inactive",
              })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            disabled={uploading}
            className="bg-blue-950 text-white px-5 py-3 rounded-lg disabled:opacity-50"
          >
            {editingId ? "Update Campaign" : "Create Campaign"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Donation Campaigns</h2>

        <div className="space-y-3">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} className="bg-white border rounded-xl p-4">
              {campaign.featured_image_url && (
                <img
                  src={campaign.featured_image_url}
                  alt={campaign.title}
                  className="h-32 w-full object-cover rounded-lg mb-3"
                />
              )}

              <h3 className="font-semibold">{campaign.title}</h3>

              <p className="text-sm text-slate-500">
                ₦{Number(campaign.amount_raised || 0).toLocaleString()} raised
                {campaign.target_amount
                  ? ` of ₦${Number(campaign.target_amount).toLocaleString()}`
                  : ""}
              </p>

              <p className="text-sm text-slate-500">{campaign.status}</p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => editCampaign(campaign)}
                  className="px-3 py-2 bg-slate-100 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteCampaign(campaign.id)}
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