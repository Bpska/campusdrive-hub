import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  PhoneCall,
  Heart,
  CalendarDays,
  CheckCircle2,
  UserCog,
  Loader2,
} from "lucide-react";
import {
  statusColor,
} from "@/lib/mock-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, studentApi, activityApi } from "@/lib/api";

export function AdminDashboard() {
  const { data: dashData, isLoading: isDashLoading, error: dashError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: dashboardApi.getStats,
  });

  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ["students", "upcoming-visits"],
    queryFn: () => studentApi.list({ limit: 100 }),
  });

  const { data: activitiesData, isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: activityApi.list,
  });

  const isLoading = isDashLoading || isStudentsLoading || isActivitiesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dashError || !dashData) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        Failed to load dashboard data. Please try again.
      </div>
    );
  }

  const { stats, callTrends } = dashData;
  const upcoming = (studentsData?.students || []).filter((s) => s.visitDate).slice(0, 5);
  const recentActivities = activitiesData || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        description="Overview of leads, calls, visits and admission performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total Leads" value={stats.totalLeads} icon={Users} trend="+12% this week" />
        <StatCard label="Total Calls" value={stats.totalCalls} icon={PhoneCall} tone="sky" trend="+5.2%" />
        <StatCard label="Interested" value={stats.interested} icon={Heart} tone="violet" />
        <StatCard label="Visits Scheduled" value={stats.visitsScheduled} icon={CalendarDays} tone="amber" />
        <StatCard label="Admissions" value={stats.admissions} icon={CheckCircle2} tone="emerald" trend="+8 today" />
        <StatCard label="Staff" value={stats.staffCount} icon={UserCog} tone="rose" />
      </div>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Call activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily">
            <TabsList className="mb-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily" className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={callTrends.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="currentColor" fontSize={12} />
                  <YAxis stroke="currentColor" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="hsl(217 91% 60%)" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="weekly" className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callTrends.weekly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="calls" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="monthly" className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callTrends.monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="calls" fill="hsl(217 91% 60%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="divide-y divide-border">
              {recentActivities.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-center gap-3 py-3 text-sm">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {a.actor.split(" ").map((x) => x[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-foreground">
                      <span className="font-medium">{a.actor}</span>{" "}
                      <span className="text-muted-foreground">{a.action}</span>{" "}
                      <span className="font-medium">{a.target}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.time).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {recentActivities.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No recent activities.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Upcoming visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((s) => (
              <div key={s.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{s.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{s.course}</div>
                  </div>
                  <Badge variant="outline" className={statusColor(s.status)}>
                    {s.visitDate}
                  </Badge>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No upcoming visits scheduled.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}