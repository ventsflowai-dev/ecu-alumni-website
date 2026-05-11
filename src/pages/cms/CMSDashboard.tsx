import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Image as ImageIcon, Heart, Megaphone } from "lucide-react";

const tables = [
  { key: "blog_posts", label: "Blog Posts", icon: FileText, color: "from-blue-500 to-cyan-400" },
  { key: "events", label: "Events", icon: Calendar, color: "from-purple-500 to-pink-500" },
  { key: "gallery_events", label: "Gallery Albums", icon: ImageIcon, color: "from-orange-400 to-rose-400" },
  { key: "donation_campaigns", label: "Donation Campaigns", icon: Heart, color: "from-emerald-400 to-teal-500" },
  { key: "announcements", label: "Announcements", icon: Megaphone, color: "from-indigo-500 to-blue-600" },
];

export default function CMSDashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      const results: Record<string, number> = {};

      for (const table of tables) {
        try {
          const { count } = await supabase
            .from(table.key as any)
            .select("*", { count: "exact", head: true });
          results[table.key] = count || 0;
        } catch (err) {
          console.error(`Failed to fetch count for ${table.key}`, err);
          results[table.key] = 0;
        }
      }

      setCounts(results);
      setLoading(false);
    }

    loadCounts();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-2 text-sm">Welcome to your administration dashboard. Here's what's happening today.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {tables.map((table) => {
          const Icon = table.icon;
          return (
            <Card key={table.key} className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {table.label}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${table.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-100 animate-pulse rounded" />
                  ) : (
                    counts[table.key] ?? 0
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <Card className="border-slate-200/60 shadow-sm col-span-2 md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
          <CardHeader>
            <CardTitle className="text-lg font-display">Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300 text-sm mb-4">
              Access the documentation to learn more about managing your content, users, and overall website configuration.
            </p>
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium backdrop-blur-md border border-white/10">
              Read Documentation
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}