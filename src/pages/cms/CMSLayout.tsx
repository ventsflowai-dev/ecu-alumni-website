import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/cms", label: "Dashboard" },
  { to: "/cms/blog", label: "Blog Posts" },
  { to: "/cms/events", label: "Events" },
  { to: "/cms/gallery", label: "Gallery" },
  { to: "/cms/donation-campaigns", label: "Donation Campaigns" },
  { to: "/cms/announcements", label: "Announcements" },
  { to: "/cms/members", label: "Members" },
];

export default function CMSLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-72 bg-blue-950 text-white p-6 hidden md:block">
        <h1 className="text-xl font-bold mb-8">ECU CMS</h1>

        <nav className="space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/cms"}
              className={({ isActive }) =>
                `block rounded-lg px-4 py-3 text-sm ${
                  isActive
                    ? "bg-red-600 text-white"
                    : "text-blue-100 hover:bg-blue-900"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1">
        <header className="bg-white border-b px-6 py-4">
          <h2 className="font-semibold text-slate-800">Admin Dashboard</h2>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}