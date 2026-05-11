import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Calendar, Image as ImageIcon, 
  Heart, Megaphone, Users, Menu, X, ArrowLeft, Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/cms", label: "Dashboard", icon: LayoutDashboard },
  { to: "/cms/blog", label: "Blog Posts", icon: FileText },
  { to: "/cms/events", label: "Events", icon: Calendar },
  { to: "/cms/gallery", label: "Gallery", icon: ImageIcon },
  { to: "/cms/donation-campaigns", label: "Donation Campaigns", icon: Heart },
  { to: "/cms/donations", label: "Donations", icon: Banknote },
  { to: "/cms/announcements", label: "Announcements", icon: Megaphone },
  { to: "/cms/members", label: "Members", icon: Users },
];

export default function CMSLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Find current page title based on the route
  const currentLink = links.find(l => {
    if (l.to === "/cms") return location.pathname === "/cms";
    return location.pathname.startsWith(l.to);
  });

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        flex flex-col border-r border-slate-800 shadow-2xl
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">ECU CMS</h1>
            <p className="text-xs text-slate-400 mt-1">Admin Portal</p>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pb-6">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/cms"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[inset_0px_0px_20px_rgba(37,99,235,0.05)]"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                    {link.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-900">
          <NavLink to="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Website
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-500 hover:text-slate-800" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="font-display font-semibold text-slate-800 text-lg hidden sm:block">
              {currentLink?.label || "CMS Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
              AD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative">
          <div className="mx-auto max-w-6xl w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}