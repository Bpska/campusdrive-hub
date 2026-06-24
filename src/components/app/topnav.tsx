import { Bell, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";
import { NOTIFICATIONS } from "@/lib/mock-data";

export function TopNav({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth();
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur md:px-6">
      <button
        className="grid h-9 w-9 place-items-center rounded-md border border-border text-foreground md:hidden"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search students, staff, leads…" className="pl-9" />
      </div>
      <div className="flex-1 md:hidden" />
      <Link
        to="/notifications"
        className="relative grid h-9 w-9 place-items-center rounded-md border border-border text-foreground hover:bg-accent"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread}
          </span>
        )}
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 hover:bg-accent">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {user?.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-medium leading-tight text-foreground">{user?.name}</div>
              <div className="text-[11px] capitalize leading-tight text-muted-foreground">{user?.role}</div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}