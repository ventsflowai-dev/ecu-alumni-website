import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, Image, Heart, Megaphone, Mail } from "lucide-react";
import { MembersPanel } from "@/components/admin/MembersPanel";
import { BlogPanel } from "@/components/admin/BlogPanel";
import { EventsPanel } from "@/components/admin/EventsPanel";
import { GalleryPanel } from "@/components/admin/GalleryPanel";
import { CampaignsPanel } from "@/components/admin/CampaignsPanel";
import { AnnouncementsPanel } from "@/components/admin/AnnouncementsPanel";
import { MessagesPanel } from "@/components/admin/MessagesPanel";

const Admin = () => (
  <Layout>
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage members, content, and communications.</p>
        <div className="mt-4">
          <Link to="/cms">
            <Button className="bg-blue-950 text-white hover:bg-blue-900">
              Open Full Content Management System (CMS)
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-6 flex-wrap h-auto">
          <TabsTrigger value="members"><Users className="h-4 w-4 mr-1.5" />Members</TabsTrigger>
          <TabsTrigger value="blog"><FileText className="h-4 w-4 mr-1.5" />Blog</TabsTrigger>
          <TabsTrigger value="events"><Calendar className="h-4 w-4 mr-1.5" />Events</TabsTrigger>
          <TabsTrigger value="gallery"><Image className="h-4 w-4 mr-1.5" />Gallery</TabsTrigger>
          <TabsTrigger value="campaigns"><Heart className="h-4 w-4 mr-1.5" />Campaigns</TabsTrigger>
          <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 mr-1.5" />Announcements</TabsTrigger>
          <TabsTrigger value="messages"><Mail className="h-4 w-4 mr-1.5" />Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="members"><MembersPanel /></TabsContent>
        <TabsContent value="blog"><BlogPanel /></TabsContent>
        <TabsContent value="events"><EventsPanel /></TabsContent>
        <TabsContent value="gallery"><GalleryPanel /></TabsContent>
        <TabsContent value="campaigns"><CampaignsPanel /></TabsContent>
        <TabsContent value="announcements"><AnnouncementsPanel /></TabsContent>
        <TabsContent value="messages"><MessagesPanel /></TabsContent>
      </Tabs>
    </div>
  </Layout>
);

export default Admin;
