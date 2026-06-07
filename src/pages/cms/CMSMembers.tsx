import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, CheckCircle, XCircle, Clock, ShieldAlert, ShieldCheck, Mail, MapPin, Briefcase, GraduationCap, Loader2, Users } from "lucide-react";

type MemberStatus = "pending" | "approved" | "suspended";

type Member = {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  graduation_year: number;
  department: string;
  faculty: string;
  current_city: string;
  current_country: string;
  profession: string;
  workplace: string;
  bio: string;
  profile_photo_url: string;
  status: MemberStatus;
  subgroups?: string;
  created_at?: string;
};

export default function CMSMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MemberStatus>("all");
  const [loading, setLoading] = useState(false);

  async function loadMembers() {
    setLoading(true);

    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMembers((data || []) as Member[]);
  }

  async function loadRoles() {
    const { data } = await supabase.from("user_roles").select("user_id, role");
    if (data) {
      const rolesMap: Record<string, string> = {};
      data.forEach((r: any) => {
        // Prioritize 'admin' role so it is never overwritten by 'member'
        if (r.role === "admin" || !rolesMap[r.user_id]) {
          rolesMap[r.user_id] = r.role;
        }
      });
      setUserRoles(rolesMap);
    }
  }

  useEffect(() => {
    loadMembers();
    loadRoles();
  }, [statusFilter]);

  async function toggleAdmin(userId: string | undefined, currentRole: string | undefined) {
    if (!userId) return;
    const makeAdmin = currentRole !== "admin";
    if (!confirm(`Are you sure you want to ${makeAdmin ? "grant" : "revoke"} admin access for this user?`)) return;
    
    const { error } = await supabase.rpc('set_user_admin', {
      _user_id: userId,
      _make_admin: makeAdmin
    });

    if (error) {
      alert(error.message);
      return;
    }
    
    loadRoles();
  }

  async function updateStatus(id: string, status: MemberStatus) {
    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadMembers();
  }

  async function deleteMember(id: string) {
    if (!confirm("Delete this member profile?")) return;

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadMembers();
  }

  const filteredMembers = members.filter((member) => {
    const value = `${member.full_name} ${member.email} ${member.department} ${member.graduation_year} ${member.profession} ${member.subgroups || ""}`
      .toLowerCase();

    return value.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Members Management</h1>
          <p className="text-slate-500 mt-1">
            Approve, suspend, and manage alumni profiles and roles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value: "all" | MemberStatus) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mb-4" />
          <p>Loading members...</p>
        </div>
      )}

      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100 flex gap-5">
                  <div className="shrink-0">
                    {member.profile_photo_url ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm ring-2 ring-slate-100">
                        <img
                          src={member.profile_photo_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center font-display font-bold text-slate-500 text-xl border-2 border-white shadow-sm ring-2 ring-slate-100">
                        {member.full_name?.charAt(0) || "M"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h2 className="font-semibold text-lg text-slate-900 truncate">
                        {member.full_name}
                      </h2>
                      <div className="flex gap-2 shrink-0">
                        {member.status === "approved" && <Badge className="bg-green-100 text-green-700 border-green-200">Approved</Badge>}
                        {member.status === "pending" && <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>}
                        {member.status === "suspended" && <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">Suspended</Badge>}
                        {member.user_id && userRoles[member.user_id] === "admin" && (
                          <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">Admin</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.department} • '{String(member.graduation_year).slice(-2)}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.profession || "No profession set"}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.current_city ? `${member.current_city}, ${member.current_country}` : "Location not set"}</span>
                      </div>
                    </div>
                    {member.subgroups && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {member.subgroups.split(",").map((s: string) => s.trim()).filter(Boolean).map((sub: string) => (
                          <Badge key={sub} variant="outline" className="text-[10px] py-0.5 px-2 bg-slate-50 text-slate-600 border-slate-200">
                            {sub}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 md:w-64 bg-slate-50 flex flex-col justify-center gap-2 shrink-0">
                  {member.status !== "approved" && (
                    <Button size="sm" onClick={() => updateStatus(member.id, "approved")} className="w-full bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-3.5 w-3.5 mr-2" />
                      Approve
                    </Button>
                  )}

                  {member.status !== "suspended" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(member.id, "suspended")} className="w-full border-red-200 text-red-600 hover:bg-red-50">
                      <XCircle className="h-3.5 w-3.5 mr-2" />
                      Suspend
                    </Button>
                  )}

                  {member.status !== "pending" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(member.id, "pending")} className="w-full">
                      <Clock className="h-3.5 w-3.5 mr-2" />
                      Mark Pending
                    </Button>
                  )}

                  {member.user_id && (
                    <Button
                      size="sm"
                      variant={userRoles[member.user_id!] === "admin" ? "outline" : "secondary"}
                      onClick={() => toggleAdmin(member.user_id, userRoles[member.user_id!])}
                      className="w-full border-purple-200 text-purple-700"
                    >
                      {userRoles[member.user_id!] === "admin" ? (
                        <><ShieldAlert className="h-3.5 w-3.5 mr-2" /> Revoke Admin</>
                      ) : (
                        <><ShieldCheck className="h-3.5 w-3.5 mr-2" /> Make Admin</>
                      )}
                    </Button>
                  )}

                  <Button size="sm" variant="ghost" onClick={() => deleteMember(member.id)} className="w-full text-slate-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Delete Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && filteredMembers.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <Users className="h-10 w-10 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No members found</h3>
            <p className="text-slate-500">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}