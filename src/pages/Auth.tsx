import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(72),
});

const Auth = () => {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: parsed.data.full_name } },
        });
        if (error) throw error;
        toast.success("Welcome! Your account is created. An admin will approve your directory listing shortly.");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6"><Logo /></div>
        <Card className="p-8 shadow-elegant">
          <h1 className="font-display text-2xl font-bold mb-1">{mode === "signup" ? "Join the Alumni Database" : "Welcome back"}</h1>
          <p className="text-sm text-muted-foreground mb-6">{mode === "signup" ? "Create your ECU alumni account." : "Sign in to your member portal."}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" required maxLength={200} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {mode === "signup" && <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters.</p>}
            </div>
            <Button type="submit" disabled={loading} size="lg" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>Already a member? <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">Sign in</button></>
            ) : (
              <>New here? <button onClick={() => setMode("signup")} className="text-primary font-medium hover:underline">Create an account</button></>
            )}
          </div>
        </Card>
        <div className="text-center mt-6"><Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Back to home</Link></div>
      </div>
    </div>
  );
};

export default Auth;
