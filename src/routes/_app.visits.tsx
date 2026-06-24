import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { STUDENTS, statusColor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/visits")({
  component: VisitsPage,
});

function VisitsPage() {
  const visits = STUDENTS.filter((s) => s.visitDate).slice(0, 18);
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const startDay = monthStart.getDay();

  const byDay = new Map<string, typeof visits>();
  visits.forEach((v) => {
    if (!v.visitDate) return;
    const arr = byDay.get(v.visitDate) ?? [];
    arr.push(v);
    byDay.set(v.visitDate, arr);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Visit schedule" description="All campus visits across staff and students." />

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">
                {today.toLocaleString(undefined, { month: "long", year: "numeric" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-muted-foreground">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                  <div key={d} className="py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay }).map((_, i) => (
                  <div key={`b${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const iso = new Date(today.getFullYear(), today.getMonth(), day)
                    .toISOString()
                    .slice(0, 10);
                  const items = byDay.get(iso) ?? [];
                  const isToday = day === today.getDate();
                  return (
                    <div
                      key={day}
                      className={cn(
                        "min-h-20 rounded-md border border-border p-1.5 text-left",
                        isToday && "border-primary bg-primary/5",
                      )}
                    >
                      <div className="text-xs font-semibold text-foreground">{day}</div>
                      <div className="mt-1 space-y-1">
                        {items.slice(0, 2).map((v) => (
                          <div
                            key={v.id}
                            className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                          >
                            {v.name}
                          </div>
                        ))}
                        {items.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">
                            +{items.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4 space-y-3">
          {visits.map((v) => (
            <Card key={v.id} className="border-border">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.course} · {v.assignedTo}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{v.visitDate}</Badge>
                  <Badge variant="outline" className={statusColor(v.status)}>{v.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}