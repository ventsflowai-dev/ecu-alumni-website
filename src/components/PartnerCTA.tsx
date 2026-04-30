import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const PartnerCTA = () => (
  <section className="container my-20">
    <div className="bg-gradient-hero rounded-3xl p-10 md:p-16 text-primary-foreground shadow-elegant relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative max-w-3xl">
        <div className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-accent-soft mb-4">
          <Heart className="h-4 w-4 fill-current" /> Partner With Us
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 text-balance">
          Your giving builds the next generation of ECU.
        </h2>
        <p className="text-lg text-primary-foreground/85 mb-8 leading-relaxed">
          Your giving supports student outreaches, leadership development, welfare support, and alumni initiatives.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/donate">Give Here</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);
