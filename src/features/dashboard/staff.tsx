import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, RotateCcw, Users, Loader2, MapPin, BookOpen, ListChecks } from "lucide-react";
import { statusColor } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { studentApi, activityApi, staffApi } from "@/lib/api";
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

  // Fetch the staff list to get assigned districts for this user
  const { data: staffList = [], isLoading: isStaffLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: staffApi.list,
  });

  const isLoading = isStudentsLoading || isActivitiesLoading || isStaffLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find current staff member's profile (to get assigned districts/steps/courses)
  const myProfile = staffList.find((s) => s.name === user?.name);
  const assignedDistricts = myProfile?.assignedDistricts
    ? myProfile.assignedDistricts.split(",").map((d) => d.trim()).filter(Boolean)
    : [];
  const assignedSteps = myProfile?.assignedSteps
    ? myProfile.assignedSteps.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const assignedCourses = myProfile?.assignedCourses
    ? myProfile.assignedCourses.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const allStudents = studentsData?.students || [];
  const myStudents = allStudents;

  // Calculate stats for current staff
  const visitsScheduled = myStudents.filter((s) => s.status === "Visit Scheduled").length;
  const followUps = myStudents.filter((s) => s.status === "Follow Up" || s.status === "Call Back Later").length;

  // Filter activities to show those performed by the current staff member
  const myActivities = (activitiesData || []).filter((a) => a.actor === user?.name);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description="Your assigned leads, calls and follow-ups for today."
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Students" value={myStudents.length} icon={Users} />
        <StatCard label="Follow Ups" value={followUps} icon={RotateCcw} tone="violet" />
        <StatCard label="Visits Scheduled" value={visitsScheduled} icon={CalendarDays} tone="amber" />
        <StatCard label="Total Leads Pool" value={allStudents.length} icon={Users} tone="sky" />
      </div>

      {/* Assigned Districts / Steps / Courses */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">My Assigned Scope (by Admin)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Districts */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Assigned Districts
            </div>
            {assignedDistricts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedDistricts.map((d) => (
                  <Badge key={d} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {d}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All districts (no restriction)</p>
            )}
          </div>

          {/* Steps/Statuses */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              Assigned Lead Stages
            </div>
            {assignedSteps.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedSteps.map((step) => (
                  <Badge key={step} variant="outline" className={statusColor(step as any)}>
                    {step}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All stages (no restriction)</p>
            )}
          </div>

          {/* Courses */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Assigned Courses
            </div>
            {assignedCourses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignedCourses.map((c) => (
                  <Badge key={c} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {c}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">All courses (no restriction)</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
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