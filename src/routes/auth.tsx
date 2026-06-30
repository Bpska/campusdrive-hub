import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { GraduationCap, Users, BarChart3, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    role: (search.role as string) || "admin",
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role } = Route.useSearch();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(role === "staff" ? "staff@crm.com" : "admin@crm.com");
  const [password, setPassword] = useState(role === "staff" ? "staff123" : "admin123");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  // Sync state if role query parameter changes
  useEffect(() => {
    if (role === "staff") {
      setEmail("staff@crm.com");
      setPassword("staff123");
    } else {
      setEmail("admin@crm.com");
      setPassword("admin123");
    }
  }, [role]);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await login(email.trim(), password);
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error ?? "Login failed");
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  const useDemo = (role: "admin" | "staff") => {
    if (role === "admin") {
      setEmail("admin@crm.com");
      setPassword("admin123");
    } else {
      setEmail("staff@crm.com");
      setPassword("staff123");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left branding */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-blue-800 p-12 text-white lg:flex">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_80%,white,transparent_40%)]" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/15 backdrop-blur">
            <img src="/logo2.png" alt="CRM Counsellor Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-lg font-bold">CRM Counsellor</div>
            <div className="text-xs text-white/70">Manage • Guide • Grow</div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Convert more leads into confirmed admissions.
          </h1>
          <p className="max-w-md text-white/80">
            Track calls, visits, follow-ups and your entire counselling pipeline in
            one professional workspace built for admissions teams.
          </p>
          <ul className="grid gap-3 text-sm">
            {[
              { i: Users, t: "Unified student & lead pipeline" },
              { i: BarChart3, t: "Real-time conversion analytics" },
              { i: ShieldCheck, t: "Role-based access for staff & admins" },
            ].map(({ i: Icon, t }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-white/60">
          © {new Date().getFullYear()} CRM Counsellor. All rights reserved.
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-primary text-primary-foreground">
              <img src="/logo2.png" alt="CRM Counsellor Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="text-base font-bold">CRM Counsellor</div>
              <div className="text-xs text-muted-foreground">Manage • Guide • Grow</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-foreground">Sign in to your workspace</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access the CRM dashboard.
          </p>

          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => toast.info("Password reset link sent to your email.")}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              Remember me for 30 days
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 rounded-lg border border-border bg-muted/40 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo accounts
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => useDemo("admin")}
                className="rounded-md border border-border bg-card p-3 text-left text-xs transition hover:border-primary"
              >
                <div className="font-semibold text-foreground">Admin</div>
                <div className="text-muted-foreground">admin@crm.com</div>
                <div className="text-muted-foreground">admin123</div>
              </button>
              <button
                type="button"
                onClick={() => useDemo("staff")}
                className="rounded-md border border-border bg-card p-3 text-left text-xs transition hover:border-primary"
              >
                <div className="font-semibold text-foreground">Staff</div>
                <div className="text-muted-foreground">staff@crm.com</div>
                <div className="text-muted-foreground">staff123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}