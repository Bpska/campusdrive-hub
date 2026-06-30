import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Activity,
  CalendarDays,
  BarChart3,
  Bell,
  Settings,
  PhoneCall,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ADMIN_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Lead / Consultant", icon: Users },
  { to: "/staff", label: "Staff Management", icon: UserCog },
  { to: "/activity", label: "Activity Logs", icon: Activity },
  { to: "/visits", label: "Visit Schedule", icon: CalendarDays },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const STAFF_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Lead / Consultant", icon: Users },
  { to: "/my-calls", label: "My Calls", icon: PhoneCall },
  { to: "/visits", label: "Visit Schedule", icon: CalendarDays },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

export function AppSidebar({
  onNavigate,
  collapsed,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const { user, logout } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = user?.role === "admin" ? ADMIN_ITEMS : STAFF_ITEMS;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar overflow-hidden transition-all duration-300 ease-in-out",
        collapsed ? "w-[60px]" : "w-64"
      )}
    >
      {/* Logo header */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border shrink-0",
        collapsed ? "justify-center px-0" : "gap-2 px-5"
      )}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
          <img src="/logo2.png" alt="CRM Counsellor Logo" className="h-full w-full object-cover" />
        </div>
        <div
          className={cn(
            "min-w-0 transition-all duration-200",
            collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
          )}
        >
          <div className="truncate text-sm font-bold text-sidebar-foreground whitespace-nowrap">CRM Counsellor</div>
          <div className="truncate text-[11px] text-muted-foreground whitespace-nowrap">Manage • Guide • Grow</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((it) => {
          const Icon = it.icon;
          const active = path === it.to || path.startsWith(it.to + "/");
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              title={collapsed ? it.label : undefined}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-colors relative group",
                collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2",
                active
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span
                className={cn(
                  "truncate transition-all duration-200 whitespace-nowrap",
                  collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
                )}
              >
                {it.label}
              </span>

              {/* Tooltip on collapsed */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full ml-2 z-50 rounded-md bg-popover text-popover-foreground text-xs font-medium px-2 py-1 shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {it.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <button
          onClick={logout}
          title={collapsed ? "Log out" : undefined}
          className={cn(
            "flex w-full items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative group",
            collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span
            className={cn(
              "truncate transition-all duration-200 whitespace-nowrap",
              collapsed ? "w-0 opacity-0 overflow-hidden" : "opacity-100"
            )}
          >
            Log out
          </span>
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2 z-50 rounded-md bg-popover text-popover-foreground text-xs font-medium px-2 py-1 shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Log out
            </span>
          )}
        </button>
      </div>

      {/* Expand indicator when collapsed */}
      {collapsed && (
        <div className="flex justify-center pb-3">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
        </div>
      )}
    </aside>
  );
}