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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

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


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      {/* Login form */}
      <div className="w-full max-w-md">

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
            <Button type="submit" className="w-full active:bg-black active:text-white active:scale-95 transition-all" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

        </div>
    </div>
  );
}