import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const signupSchema = z.object({
  full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
  email: z.string().trim().email("Please enter a valid email address").max(320),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  department: z.string().trim().min(1, "Department is required").max(200),
  faculty: z.string().trim().min(1, "Faculty is required").max(200),
  graduation_year: z.string().refine((val) => {
    const yr = Number(val);
    return !isNaN(yr) && yr >= 1960 && yr <= new Date().getFullYear() + 10;
  }, "Please enter a valid graduation year"),
  subgroups: z.string().trim().max(1000).optional(),
});

const Auth = () => {
  const [params] = useSearchParams();
  const initialMode = params.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    department: "",
    faculty: "",
    graduation_year: "",
    subgroups: "",
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: parsed.data.full_name,
              department: parsed.data.department,
              faculty: parsed.data.faculty,
              graduation_year: Number(parsed.data.graduation_year),
              subgroups: parsed.data.subgroups || "",
            },
          },
        });

        if (error) throw error;
        toast.success("Welcome! Your account is created. An admin will approve your profile shortly.");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-soft p-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Logo />
        </div>
        <Card className="p-8 shadow-elegant border-border/50">
          <h1 className="font-display text-2xl font-bold mb-1 text-slate-900">
            {mode === "signup" ? "Join the Alumni Database" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "signup"
              ? "Create your ECU alumni account with your profile details."
              : "Sign in to your member portal."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  required
                  maxLength={200}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="bg-secondary/30 border-border/40 focus-visible:ring-primary"
                />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-secondary/30 border-border/40 focus-visible:ring-primary"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="bg-secondary/30 border-border/40 focus-visible:ring-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department / Course</Label>
                    <Input
                      id="department"
                      required
                      maxLength={200}
                      placeholder="e.g. Computer Science"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="bg-secondary/30 border-border/40 focus-visible:ring-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="faculty">Faculty</Label>
                    <Input
                      id="faculty"
                      required
                      maxLength={200}
                      placeholder="e.g. Technology"
                      value={form.faculty}
                      onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                      className="bg-secondary/30 border-border/40 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="graduation_year">Year of Graduation</Label>
                    <Input
                      id="graduation_year"
                      type="number"
                      required
                      placeholder="e.g. 2018"
                      value={form.graduation_year}
                      onChange={(e) => setForm({ ...form, graduation_year: e.target.value })}
                      className="bg-secondary/30 border-border/40 focus-visible:ring-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subgroups">Subgroup(s) in ECU</Label>
                    <Input
                      id="subgroups"
                      placeholder="e.g. Choir, Prayer, Drama"
                      value={form.subgroups}
                      onChange={(e) => setForm({ ...form, subgroups: e.target.value })}
                      className="bg-secondary/30 border-border/40 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === "signup" && (
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters.
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold mt-6 shadow-glow"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already a member?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-primary font-medium hover:underline focus:outline-none"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button
                  onClick={() => setMode("signup")}
                  className="text-primary font-medium hover:underline focus:outline-none"
                >
                  Create an account
                </button>
              </>
            )}
          </div>
        </Card>
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
