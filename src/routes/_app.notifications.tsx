import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Notification } from "@/lib/mock-data";
import { Bell, CalendarDays, UserPlus, RotateCcw, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/lib/api";
import { toast } from "sonner";

const iconFor = (t: Notification["type"]) =>
  t === "Visit Reminder" ? CalendarDays : t === "New Lead Assigned" ? UserPlus : RotateCcw;

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationApi.list,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async (unreadIds: string[]) => {
      await Promise.all(unreadIds.map((id) => notificationApi.markRead(id)));
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unread = items.filter((i) => !i.read);
  const unreadCount = unread.length;

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    const unreadIds = unread.map((u) => u.id);
    markAllReadMutation.mutate(unreadIds);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread`}
        actions={
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mark all read
          </Button>
        }
      />
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex py-20 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-destructive">
            Failed to load notifications. Please try again.
          </div>
        ) : (
          items.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <Card
                key={n.id}
                className={`border-border transition cursor-pointer hover:border-primary/50 ${!n.read ? "bg-primary/5" : ""}`}
                onClick={() => !n.read && markReadMutation.mutate(n.id)}
              >
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
          })
        )}
        {!isLoading && items.length === 0 && (
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