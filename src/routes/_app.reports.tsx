import { createFileRoute, Navigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CONVERSION, LEAD_SOURCES, STAFF } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

const COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#1D4ED8", "#1E40AF", "#0EA5E9"];

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const callsPerStaff = STAFF.map((s) => ({ name: s.name.split(" ")[0], calls: s.callsMade }));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & analytics" description="Conversion, sources and team performance." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base">Lead sources</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={LEAD_SOURCES}
                  dataKey="value"
                  nameKey="source"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {LEAD_SOURCES.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader><CardTitle className="text-base">Admission funnel</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CONVERSION} layout="vertical">
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
                { label: "Lead → Contact", value: "75%" },
                { label: "Contact → Interested", value: "58%" },
                { label: "Interested → Visit", value: "57%" },
                { label: "Visit → Admission", value: "62%" },
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