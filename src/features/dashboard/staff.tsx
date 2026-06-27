import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, PhoneCall, RotateCcw, Users, Loader2 } from "lucide-react";
import { statusColor } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { studentApi, activityApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function StaffDashboard() {
  const { user } = useAuth();

  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ["students", "my-leads"],
    queryFn: () => studentApi.list({ limit: 1000 }),
  });

  const { data: activitiesData, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: activityApi.list,
  });

  const isLoading = isStudentsLoading || isActivitiesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const allStudents = studentsData?.students || [];
  const myStudents = allStudents.filter((s) => s.assignedTo === user?.name);
  
  // Calculate stats for current staff
  const visitsScheduled = myStudents.filter((s) => s.status === "Visit Scheduled").length;
  const followUps = myStudents.filter((s) => s.status === "Follow Up" || s.status === "Call Back Later").length;
  
  // Filter activities to show those performed by the current staff member
  const myActivities = (activitiesData || []).filter((a) => a.actor === user?.name);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My dashboard"
        description="Your assigned leads, calls and follow-ups for today."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Students" value={myStudents.length} icon={Users} />
        <StatCard label="Follow Ups" value={followUps} icon={RotateCcw} tone="violet" />
        <StatCard label="Visits Scheduled" value={visitsScheduled} icon={CalendarDays} tone="amber" />
        <StatCard label="Total Leads Pool" value={allStudents.length} icon={Users} tone="sky" />
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Recent call activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {myActivities.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate text-foreground">
                    <span className="font-medium">{a.actor}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-medium">{a.target}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.time).toLocaleString()}
                  </div>
                </div>
                <Badge variant="outline" className={statusColor("Interested")}>
                  logged
                </Badge>
              </div>
            ))}
            {myActivities.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No recent activity logged by you.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}