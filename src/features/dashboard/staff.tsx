import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, PhoneCall, RotateCcw, Users } from "lucide-react";
import { ACTIVITIES, STUDENTS, statusColor } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export function StaffDashboard() {
  const myStudents = STUDENTS.slice(0, 12);
  return (
    <div className="space-y-6">
      <PageHeader
        title="My dashboard"
        description="Your assigned leads, calls and follow-ups for today."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Students" value={myStudents.length} icon={Users} />
        <StatCard label="Calls Today" value={14} icon={PhoneCall} tone="sky" />
        <StatCard label="Follow Ups" value={6} icon={RotateCcw} tone="violet" />
        <StatCard label="Visits Scheduled" value={3} icon={CalendarDays} tone="amber" />
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Recent call activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {ACTIVITIES.slice(0, 8).map((a) => (
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}