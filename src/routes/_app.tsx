import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar } from "@/components/app/sidebar";
import { TopNav } from "@/components/app/topnav";
import { BottomNav } from "@/components/app/bottom-nav";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 space-y-6 p-4 pb-20 md:p-6 md:pb-6">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}