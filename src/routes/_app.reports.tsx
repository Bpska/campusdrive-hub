import { createFileRoute, Navigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, staffApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

const COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#1D4ED8", "#1E40AF", "#0EA5E9"];

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useAuth();
  
  const { data: dashData, isLoading: isDashLoading, error: dashError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: dashboardApi.getStats,
  });

  const { data: staffList = [], isLoading: isStaffLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: staffApi.list,
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const isLoading = isDashLoading || isStaffLoading;

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
        Failed to load reports data. Please try again.
      </div>
    );
  }

  const { leadSources, conversion } = dashData;
  const callsPerStaff = staffList.map((s) => ({
    name: s.name.split(" ")[0],
    calls: s.callsMade,
  }));

  // Dynamically calculate conversion rates based on database figures
  const leadToContactVal = conversion[0]?.value > 0 ? Math.round((conversion[1]?.value / conversion[0]?.value) * 100) : 0;
  const contactToInterestedVal = conversion[1]?.value > 0 ? Math.round((conversion[2]?.value / conversion[1]?.value) * 100) : 0;
  const interestedToVisitVal = conversion[2]?.value > 0 ? Math.round((conversion[3]?.value / conversion[2]?.value) * 100) : 0;
  const visitToAdmissionVal = conversion[3]?.value > 0 ? Math.round((conversion[4]?.value / conversion[3]?.value) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & analytics" description="Conversion, sources and team performance." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Admission funnel</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis dataKey="stage" type="category" fontSize={12} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563EB" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Calls per staff</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callsPerStaff}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="calls" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Conversion rate</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Lead → Contact", value: `${leadToContactVal}%` },
                { label: "Contact → Interested", value: `${contactToInterestedVal}%` },
                { label: "Interested → Visit", value: `${interestedToVisitVal}%` },
                { label: "Visit → Admission", value: `${visitToAdmissionVal}%` },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border p-4">
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="mt-1 text-2xl font-bold text-foreground">{m.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}