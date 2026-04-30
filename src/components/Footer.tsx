import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import { Logo } from "./Logo";

export const Footer = () => (
  <footer className="bg-sidebar text-sidebar-foreground mt-24">
    <div className="container py-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-4">
        <Logo variant="light" />
        <p className="text-sm text-sidebar-foreground/70 leading-relaxed">
          Preserving the legacy. Advancing the Kingdom. Connecting generations of ECUites from Obafemi Awolowo University.
        </p>
        <div className="flex gap-3 pt-2">
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 rounded-full bg-sidebar-accent hover:bg-accent transition-smooth"><Instagram className="h-4 w-4" /></a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 rounded-full bg-sidebar-accent hover:bg-accent transition-smooth"><Facebook className="h-4 w-4" /></a>
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="p-2 rounded-full bg-sidebar-accent hover:bg-accent transition-smooth"><Twitter className="h-4 w-4" /></a>
        </div>
      </div>

      <div>
        <h4 className="font-display text-lg mb-4">Quick Links</h4>
        <ul className="space-y-2 text-sm text-sidebar-foreground/75">
          <li><Link to="/about" className="hover:text-accent transition-smooth">About ECU</Link></li>
          <li><Link to="/directory" className="hover:text-accent transition-smooth">Alumni Directory</Link></li>
          <li><Link to="/events" className="hover:text-accent transition-smooth">Events</Link></li>
          <li><Link to="/gallery" className="hover:text-accent transition-smooth">Gallery</Link></li>
          <li><Link to="/blog" className="hover:text-accent transition-smooth">Blog</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-display text-lg mb-4">Get Involved</h4>
        <ul className="space-y-2 text-sm text-sidebar-foreground/75">
          <li><Link to="/auth?mode=signup" className="hover:text-accent transition-smooth">Join Alumni Database</Link></li>
          <li><Link to="/donate" className="hover:text-accent transition-smooth">Give Here</Link></li>
          <li><Link to="/contact" className="hover:text-accent transition-smooth">Contact Us</Link></li>
          <li><Link to="/auth" className="hover:text-accent transition-smooth">Member Portal</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-display text-lg mb-4">Contact</h4>
        <ul className="space-y-3 text-sm text-sidebar-foreground/75">
          <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0 text-accent" /><span>ECU Empowerment Center, Obafemi Awolowo University, Ile-Ife, Osun State.</span></li>
          <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 shrink-0 text-accent" /><a href="tel:+2348133836864">+234 813 383 6864</a></li>
          <li className="flex gap-2"><Mail className="h-4 w-4 mt-0.5 shrink-0 text-accent" /><a href="mailto:ecuifealunmi@gmail.com" className="break-all">ecuifealunmi@gmail.com</a></li>
        </ul>
      </div>
    </div>

    <div className="border-t border-sidebar-border">
      <div className="container py-6 text-center text-xs text-sidebar-foreground/60">
        © {new Date().getFullYear()} Evangelical Christian Union Alumni Fellowship. All rights reserved.
      </div>
    </div>
  </footer>
);
