import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Users, Headset, ShieldCheck, Download } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    });
  };

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl">
            <img src="/logo2.png" alt="CRM Counsellor Logo" className="h-full w-full object-cover" />
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold leading-tight tracking-tight">
              <span className="text-black dark:text-white">CRM</span> <span className="text-blue-600">Counsellor</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Manage • Guide • Grow</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {deferredPrompt && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 active:bg-black active:text-white active:border-black active:scale-95 transition-all duration-200"
              onClick={handleInstallClick}
            >
              <Download className="h-4 w-4" />
              Install App
            </Button>
          )}
          <Button asChild variant="outline" className="font-semibold border-primary/20 hover:bg-blue-100 hover:text-blue-900 active:scale-95 active:bg-black active:text-white active:border-black transition-all duration-200">
            <Link to="/auth" search={{ role: "admin" }}>Admin Login</Link>
          </Button>
          <Button asChild className="gap-2 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-blue-600 active:scale-95 active:bg-black active:shadow-none duration-200">
            <Link to="/auth" search={{ role: "staff" }}>
              Staff Login <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-24 pb-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="container relative mx-auto px-6 text-center">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-2xl shadow-primary/20 ring-1 ring-black/5 sm:h-32 sm:w-32">
              <img src="/logo2.png" alt="CRM Counsellor" className="h-full w-full object-cover p-2" />
            </div>
            
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
              CRM <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Counsellor</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              The ultimate CRM solution built exclusively for educational institutions and admission counsellors. Manage leads, track conversions, and grow your enrollments seamlessly.
            </p>
            
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base border-primary/20 hover:bg-blue-100 hover:text-blue-900 shadow-md transition-all hover:-translate-y-1 active:scale-95 active:bg-black active:text-white active:border-black active:shadow-none duration-200">
                <Link to="/auth" search={{ role: "admin" }}>
                  Admin Login
                </Link>
              </Button>
              <Button asChild size="lg" className="h-14 px-8 text-base shadow-xl shadow-primary/25 transition-all hover:-translate-y-1 hover:bg-blue-600 hover:shadow-primary/40 active:scale-95 active:bg-black active:shadow-none duration-200">
                <Link to="/auth" search={{ role: "staff" }}>
                  Staff Login <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              {deferredPrompt && (
                <Button size="lg" variant="ghost" className="h-14 px-8 text-base text-muted-foreground hover:text-foreground active:scale-95 active:bg-black active:text-white duration-200" onClick={handleInstallClick}>
                  <Download className="mr-2 h-5 w-5 text-primary" /> Install Web App
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-border bg-muted/30 py-24">
          <div className="container mx-auto px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Everything you need to succeed</h2>
              <p className="mt-4 text-muted-foreground">Purpose-built tools to streamline your entire admission workflow.</p>
            </div>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Unified Pipeline",
                  description: "Track every student from the first call to final enrollment in one intuitive dashboard.",
                  icon: Users,
                },
                {
                  title: "Smart Analytics",
                  description: "Real-time insights into conversion rates, counselor performance, and campaign ROI.",
                  icon: BarChart3,
                },
                {
                  title: "Call & Visit Tracking",
                  description: "Log interactions instantly and never miss a follow-up with automated reminders.",
                  icon: Headset,
                },
                {
                  title: "Secure Access",
                  description: "Enterprise-grade role-based access control for administrators, staff, and partners.",
                  icon: ShieldCheck,
                },
              ].map((feature, idx) => (
                <div key={idx} className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
              <img src="/logo2.png" alt="CRM Counsellor" className="h-full w-full object-cover grayscale opacity-80" />
            </div>
            <span className="font-semibold text-foreground">CRM Counsellor</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CRM Counsellor. Manage • Guide • Grow.
          </p>
        </div>
      </footer>
    </div>
  );
}
