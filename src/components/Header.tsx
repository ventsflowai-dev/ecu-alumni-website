import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/directory", label: "Alumni Directory" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/blog", label: "Blog" },
  { to: "/donate", label: "Donate" },
  { to: "/contact", label: "Contact" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-smooth hover:text-primary ${
                  isActive ? "text-primary" : "text-foreground/75"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1.5" />Dashboard</Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin"><Shield className="h-4 w-4 mr-1.5" />Admin</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-1.5" />Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Login</Link></Button>
              <Button asChild size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link to="/auth?mode=signup">Join Alumni</Link>
              </Button>
            </>
          )}
        </div>

        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-md text-sm font-medium ${isActive ? "bg-secondary text-primary" : "text-foreground/80"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-3 mt-2 border-t border-border flex flex-col gap-2">
              {user ? (
                <>
                  <Button asChild variant="outline"><Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link></Button>
                  {isAdmin && <Button asChild variant="outline"><Link to="/admin" onClick={() => setOpen(false)}>Admin</Link></Button>}
                  <Button variant="ghost" onClick={() => { signOut(); setOpen(false); }}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline"><Link to="/auth" onClick={() => setOpen(false)}>Login</Link></Button>
                  <Button asChild className="bg-accent text-accent-foreground"><Link to="/auth?mode=signup" onClick={() => setOpen(false)}>Join Alumni Database</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
