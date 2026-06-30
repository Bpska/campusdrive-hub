import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Notification, type Student } from "@/lib/mock-data";
import { Bell, CalendarDays, UserPlus, RotateCcw, Loader2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationApi, studentApi } from "@/lib/api";
import { toast } from "sonner";
import { useState } from "react";
import { StudentDrawer } from "@/components/app/student-drawer";
import { CallUpdateModal } from "@/components/app/call-modal";

const iconFor = (t: Notification["type"]) =>
  t === "Visit Reminder" ? CalendarDays : t === "New Lead Assigned" ? UserPlus : RotateCcw;

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [drawerStudentId, setDrawerStudentId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [callStudent, setCallStudent] = useState<Student | null>(null);
  const [callOpen, setCallOpen] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to delete notification");
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

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) {
      markReadMutation.mutate(n.id);
    }

    // If notification has a linked student, open the drawer
    if (n.studentId) {
      setDrawerStudentId(n.studentId);
      setDrawerOpen(true);
      return;
    }

    // Fallback: try to extract student name and navigate
    let studentName = "";
    if (n.body.includes("is scheduled to visit")) {
      studentName = n.body.split(" is scheduled")[0];
    } else if (n.body.includes("has been assigned to you")) {
      studentName = n.body.split(" has been assigned")[0];
    }

    if (studentName) {
      navigate({ to: "/students", search: `?q=${encodeURIComponent(studentName)}` });
    }
  };

  const handleOpenCall = async (studentId: string) => {
    try {
      const student = await studentApi.get(studentId);
      setDrawerOpen(false);
      setCallStudent(student);
      setCallOpen(true);
    } catch {
      toast.error("Could not load student details");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread · ${items.length} total`}
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
            const hasStudent = !!n.studentId;
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === n.id;
            return (
              <Card
                key={n.id}
                className={`border-border transition cursor-pointer hover:border-primary/50 hover:shadow-md ${!n.read ? "bg-primary/5" : ""}`}
                onClick={() => handleNotificationClick(n)}
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
                      {hasStudent && (
                        <span className="rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                          View Student →
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <div className="mt-1 text-xs text-muted-foreground">{n.time}</div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(n.id);
                    }}
                    disabled={isDeleting}
                    className="ml-2 shrink-0 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Delete notification"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
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

      {/* Student detail drawer */}
      <StudentDrawer
        studentId={drawerStudentId}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setDrawerStudentId(null);
        }}
        onCall={() => {
          if (drawerStudentId) handleOpenCall(drawerStudentId);
        }}
      />

      {/* Call update modal */}
      <CallUpdateModal
        student={callStudent}
        open={callOpen}
        onOpenChange={(open) => {
          setCallOpen(open);
          if (!open) setCallStudent(null);
        }}
      />
    </div>
  );
}