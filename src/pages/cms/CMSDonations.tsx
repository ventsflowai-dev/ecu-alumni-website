import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function CMSDonations() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchDonations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("donations")
      .select("*, donation_campaigns(title)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch donations");
      console.error(error);
    } else {
      setDonations(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (donationId: string, currentStatus: "successful" | "pending" | "failed", newStatus: "successful" | "pending" | "failed") => {
    if (currentStatus === newStatus) return;
    
    const updatingToast = toast.loading(`Updating status to ${newStatus}...`);
    
    try {
      const { error } = await supabase
        .from("donations")
        .update({ payment_status: newStatus })
        .eq("id", donationId);
        
      if (error) throw error;
      
      // If we are marking a donation as successful, let's also increment the campaign's amount_raised if appropriate!
      if (newStatus === "successful") {
        const donation = donations.find(d => d.id === donationId);
        if (donation && donation.campaign_id) {
          const { data: campaign } = await supabase
            .from("donation_campaigns")
            .select("amount_raised")
            .eq("id", donation.campaign_id)
            .single();
            
          if (campaign) {
            const newRaisedAmount = Number(campaign.amount_raised) + Number(donation.amount);
            await supabase
              .from("donation_campaigns")
              .update({ amount_raised: newRaisedAmount })
              .eq("id", donation.campaign_id);
          }
        }
      }
      
      toast.success("Donation status updated successfully!");
      fetchDonations();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update donation status");
    } finally {
      toast.dismiss(updatingToast);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const fmt = (n: number, currency: string = "NGN") =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const filteredDonations = activeTab === "all" ? donations : donations.filter((d) => d.payment_status === activeTab);

  const totalAmount = donations.filter((d) => d.payment_status === "successful").reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Donations</h2>
          <p className="text-muted-foreground mt-1">View and track all incoming donations.</p>
        </div>
        <Button onClick={fetchDonations} variant="outline" size="sm" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="shadow-elegant border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue (Successful)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{fmt(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-elegant border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{donations.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-elegant border-border/50">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <div className="px-6 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="successful">Successful</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filteredDonations.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">No donations found in this category.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/30">
                  <tr>
                    <th className="px-6 py-4 font-medium">Donor</th>
                    <th className="px-6 py-4 font-medium">Campaign</th>
                    <th className="px-6 py-4 font-medium">Amount</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-secondary/20 transition-smooth">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{d.donor_name}</div>
                        <div className="text-xs text-muted-foreground">{d.donor_email}</div>
                      </td>
                      <td className="px-6 py-4">{d.donation_campaigns?.title || "General"}</td>
                      <td className="px-6 py-4 font-semibold text-primary">{fmt(Number(d.amount), d.currency)}</td>
                      <td className="px-6 py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger className={`
                            inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:opacity-80 select-none gap-1
                            ${d.payment_status === "successful" 
                              ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/80" 
                              : d.payment_status === "pending" 
                                ? "text-foreground border-border bg-transparent" 
                                : "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80"
                            }
                          `}>
                            {d.payment_status} <span className="text-[10px]">▼</span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="bg-background border border-border shadow-elegant">
                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateStatus(d.id, d.payment_status, "pending")} className="cursor-pointer">
                              Mark as Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(d.id, d.payment_status, "successful")} className="cursor-pointer">
                              Mark as Successful
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateStatus(d.id, d.payment_status, "failed")} className="cursor-pointer">
                              Mark as Failed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">
                        {d.payment_reference || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
