import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  created_at?: string;
};

export default function CMSMembers() {
  const [members, setMembers] = useState<Member[]>([]);
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

  useEffect(() => {
    loadMembers();
  }, [statusFilter]);

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
    const value = `${member.full_name} ${member.email} ${member.department} ${member.graduation_year} ${member.profession}`
      .toLowerCase();

    return value.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Members Management</h1>
          <p className="text-slate-500">
            Approve, suspend, and manage alumni profiles.
          </p>
        </div>

        <div className="flex gap-3">
          <input
            className="border rounded-lg p-3"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded-lg p-3"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | MemberStatus)
            }
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {loading && <p className="text-slate-500">Loading members...</p>}

      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white border rounded-xl p-5 flex flex-col md:flex-row gap-5 md:items-center md:justify-between"
          >
            <div className="flex gap-4">
              {member.profile_photo_url ? (
                <img
                  src={member.profile_photo_url}
                  alt={member.full_name}
                  className="w-16 h-16 rounded-full object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                  {member.full_name?.charAt(0) || "M"}
                </div>
              )}

              <div>
                <h2 className="font-semibold text-lg">{member.full_name}</h2>
                <p className="text-sm text-slate-500">{member.email}</p>
                <p className="text-sm text-slate-500">
                  {member.department} • {member.graduation_year}
                </p>
                <p className="text-sm text-slate-500">
                  {member.profession} {member.current_city && `• ${member.current_city}`}
                </p>

                <span
                  className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${
                    member.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : member.status === "suspended"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {member.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {member.status !== "approved" && (
                <button
                  onClick={() => updateStatus(member.id, "approved")}
                  className="px-3 py-2 bg-green-600 text-white rounded"
                >
                  Approve
                </button>
              )}

              {member.status !== "suspended" && (
                <button
                  onClick={() => updateStatus(member.id, "suspended")}
                  className="px-3 py-2 bg-orange-500 text-white rounded"
                >
                  Suspend
                </button>
              )}

              {member.status !== "pending" && (
                <button
                  onClick={() => updateStatus(member.id, "pending")}
                  className="px-3 py-2 bg-slate-100 rounded"
                >
                  Mark Pending
                </button>
              )}

              <button
                onClick={() => deleteMember(member.id)}
                className="px-3 py-2 bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!loading && filteredMembers.length === 0 && (
          <div className="bg-white border rounded-xl p-6 text-slate-500">
            No members found.
          </div>
        )}
      </div>
    </div>
  );
}