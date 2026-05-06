import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const tables = [
  { key: "blog_posts", label: "Blog Posts" },
  { key: "events", label: "Events" },
  { key: "gallery_events", label: "Gallery Albums" },
  { key: "donation_campaigns", label: "Donation Campaigns" },
  { key: "announcements", label: "Announcements" },
];

export default function CMSDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
  console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);

  async function testSupabase() {
    const { data, error } = await supabase
      .from("gallery_events")
      .select("*");

    console.log("Supabase test data:", data);
    console.log("Supabase test error:", error);
  }

  testSupabase();
}, []);

console.log("ENV URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("ENV KEY:", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.slice(0, 20));

  useEffect(() => {
    async function loadCounts() {
      const results: Record<string, number> = {};

      for (const table of tables) {
        const { count } = await supabase
          .from(table.key as any)
          .select("*", { count: "exact", head: true });

        results[table.key] = count || 0;
      }

      setCounts(results);
    }

    loadCounts();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">CMS Overview</h1>

      <div className="grid md:grid-cols-3 gap-4">
        {tables.map((table) => (
          <div key={table.key} className="bg-white border rounded-xl p-5">
            <p className="text-sm text-slate-500">{table.label}</p>
            <h2 className="text-3xl font-bold mt-2">
              {counts[table.key] ?? "..."}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}