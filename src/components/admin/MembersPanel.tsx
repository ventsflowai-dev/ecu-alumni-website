import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Check, X, Shield, ShieldOff, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  status: "pending" | "approved" | "suspended";
  graduation_year: number | null;
  current_city: string | null;
  profession: string | null;
  profile_photo_url: string | null;
  created_at: string;
}

export const MembersPanel = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [admins, setAdmins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: profs }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    setProfiles((profs ?? []) as Profile[]);
    setAdmins(new Set((roles ?? []).map((r: any) => r.user_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (user_id: string, status: "approved" | "pending" | "suspended") => {
    setBusy(user_id);
    const { error } = await supabase.rpc("set_profile_status", { _user_id: user_id, _status: status });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(`Member ${status}`);
    load();
  };

  const toggleAdmin = async (user_id: string, makeAdmin: boolean) => {
    setBusy(user_id);
    const { error } = await supabase.rpc("set_user_admin", { _user_id: user_id, _make_admin: makeAdmin });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(makeAdmin ? "Promoted to admin" : "Admin role removed");
    load();
  };

  const filtered = profiles.filter((p) => {
    const s = q.toLowerCase();
    return !s || p.full_name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s);
  });

  if (loading) return <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-5 gap-3 flex-wrap">
        <h2 className="font-display text-2xl font-bold">Members ({profiles.length})</h2>
        <div className="relative max-w-xs">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b">
            <tr><th className="py-2">Member</th><th>Class</th><th>Status</th><th>Role</th><th>Joined</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const isAdmin = admins.has(p.user_id);
              return (
                <tr key={p.user_id} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={p.profile_photo_url ?? undefined} />
                        <AvatarFallback>{p.full_name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{p.full_name || "(no name)"}</div>
                        <div className="text-xs text-muted-foreground">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.graduation_year ?? "—"}</td>
                  <td>
                    <Badge variant={p.status === "approved" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>
                      {p.status}
                    </Badge>
                  </td>
                  <td>{isAdmin ? <Badge>Admin</Badge> : <span className="text-xs text-muted-foreground">Member</span>}</td>
                  <td className="text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      {p.status !== "approved" && (
                        <Button size="sm" variant="outline" disabled={busy === p.user_id} onClick={() => setStatus(p.user_id, "approved")}>
                          <Check className="h-3.5 w-3.5 mr-1" />Approve
                        </Button>
                      )}
                      {p.status !== "suspended" && (
                        <Button size="sm" variant="outline" disabled={busy === p.user_id} onClick={() => setStatus(p.user_id, "suspended")}>
                          <X className="h-3.5 w-3.5 mr-1" />Suspend
                        </Button>
                      )}
                      <Button size="sm" variant="outline" disabled={busy === p.user_id} onClick={() => toggleAdmin(p.user_id, !isAdmin)}>
                        {isAdmin ? <><ShieldOff className="h-3.5 w-3.5 mr-1" />Remove admin</> : <><Shield className="h-3.5 w-3.5 mr-1" />Make admin</>}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No members found.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
