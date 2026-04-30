import logo from "@/assets/ecu-logo.png";
import { Link } from "react-router-dom";

export const Logo = ({ variant = "dark", showText = true }: { variant?: "dark" | "light"; showText?: boolean }) => (
  <Link to="/" className="flex items-center gap-3 group">
    <img src={logo} alt="ECU Alumni Fellowship logo" className="h-12 w-12 object-contain" width={48} height={48} />
    {showText && (
      <div className={`leading-tight ${variant === "light" ? "text-primary-foreground" : "text-foreground"}`}>
        <div className="font-display text-base font-bold tracking-tight">ECU Alumni</div>
        <div className="text-[10px] uppercase tracking-[0.18em] opacity-70">Fellowship</div>
      </div>
    )}
  </Link>
);
