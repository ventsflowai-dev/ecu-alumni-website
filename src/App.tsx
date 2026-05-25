import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import CMSLayout from "./pages/cms/CMSLayout";
import CMSDashboard from "./pages/cms/CMSDashboard";
import CMSBlog from "./pages/cms/CMSBlog";
import CMSEvents from "./pages/cms/CMSEvents";
import CMSGallery from "./pages/cms/CMSGallery";
import CMSDonationCampaigns from "./pages/cms/CMSDonationCampaigns";
import CMSDonations from "./pages/cms/CMSDonations";
import CMSAnnouncements from "./pages/cms/CMSAnnouncements";
import CMSMembers from "./pages/cms/CMSMembers";


import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Gallery from "./pages/Gallery";
import GalleryDetail from "./pages/GalleryDetail";
import Donate from "./pages/Donate";
import Directory from "./pages/Directory";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:slug" element={<EventDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:slug" element={<GalleryDetail />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
            <Route path="/cms" element={<ProtectedRoute adminOnly><CMSLayout /></ProtectedRoute>}>
  <Route index element={<CMSDashboard />} />
  <Route path="blog" element={<CMSBlog />} />
  <Route path="events" element={<CMSEvents />} />
   <Route path="gallery" element={<CMSGallery />} />
    <Route path="donation-campaigns" element={<CMSDonationCampaigns />} />
    <Route path="donations" element={<CMSDonations />} />
    <Route path="announcements" element={<CMSAnnouncements />} />
    <Route path="members" element={<CMSMembers />} />
</Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
