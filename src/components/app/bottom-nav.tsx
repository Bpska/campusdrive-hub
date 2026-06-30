import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, CalendarDays, Bell, BarChart3, PhoneCall } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { user } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const items =
    user?.role === "admin"
      ? [
          { to: "/dashboard", label: "Home", icon: LayoutDashboard },
          { to: "/students", label: "Lead", icon: Users },
          { to: "/visits", label: "Visits", icon: CalendarDays },
          { to: "/reports", label: "Reports", icon: BarChart3 },
          { to: "/notifications", label: "Alerts", icon: Bell },
        ]
      : [
          { to: "/dashboard", label: "Home", icon: LayoutDashboard },
          { to: "/students", label: "Lead", icon: Users },
          { to: "/my-calls", label: "Calls", icon: PhoneCall },
          { to: "/visits", label: "Visits", icon: CalendarDays },
          { to: "/notifications", label: "Alerts", icon: Bell },
        ];

  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card md:hidden">
      {items.map((it) => {
        const Icon = it.icon;
        const active = path === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={cn(
              "flex flex-col items-center gap-1 py-2 text-[11px]",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}