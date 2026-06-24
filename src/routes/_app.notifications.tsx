import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NOTIFICATIONS, type Notification } from "@/lib/mock-data";
import { Bell, CalendarDays, UserPlus, RotateCcw } from "lucide-react";

const iconFor = (t: Notification["type"]) =>
  t === "Visit Reminder" ? CalendarDays : t === "New Lead Assigned" ? UserPlus : RotateCcw;

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(NOTIFICATIONS);
  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unread} unread`}
        actions={
          <Button
            variant="outline"
            onClick={() => setItems((p) => p.map((n) => ({ ...n, read: true })))}
          >
            Mark all read
          </Button>
        }
      />
      <div className="space-y-3">
        {items.map((n) => {
          const Icon = iconFor(n.type);
          return (
            <Card key={n.id} className="border-border">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-foreground">{n.title}</div>
                    <Badge variant="outline" className="text-xs">{n.type}</Badge>
                    {!n.read && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                  <div className="mt-1 text-xs text-muted-foreground">{n.time}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {items.length === 0 && (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
              <Bell className="mb-3 h-8 w-8" />
              You're all caught up.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}