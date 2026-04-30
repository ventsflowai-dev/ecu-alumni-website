import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const AdminPlaceholder = () => (
  <Layout>
    <div className="container py-20 max-w-3xl">
      <Card className="p-10 text-center">
        <div className="h-16 w-16 rounded-full bg-accent/10 text-accent grid place-items-center mx-auto mb-5"><Shield className="h-7 w-7" /></div>
        <h1 className="font-display text-3xl font-bold mb-3">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-2">You have admin access. ✓</p>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          The full CMS — members management, blog, events, gallery, donation campaigns, announcements, contact messages — is queued for the next phase. The database, RLS policies, and storage buckets are already provisioned and ready.
        </p>
        <Link to="/dashboard" className="text-primary text-sm mt-6 inline-block">← Back to member dashboard</Link>
      </Card>
    </div>
  </Layout>
);

export default AdminPlaceholder;
