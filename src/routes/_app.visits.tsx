import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { statusColor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/visits")({
  component: VisitsPage,
});

function VisitsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["students", "visits"],
    queryFn: () => studentApi.list({ limit: 100 }),
  });

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${today.getFullYear()}-${m}-${d}`;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
        Failed to load visit schedule. Please try again.
      </div>
    );
  }

  const visits = data.students.filter((s) => s.visitDate);

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
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span>{today.toLocaleString(undefined, { month: "long", year: "numeric" })}</span>
                <span className="text-xs font-normal text-muted-foreground hidden md:inline">
                  Click a date to view detailed scheduled visits
                </span>
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
                  const m = String(today.getMonth() + 1).padStart(2, "0");
                  const dStr = String(day).padStart(2, "0");
                  const iso = `${today.getFullYear()}-${m}-${dStr}`;
                  const items = byDay.get(iso) ?? [];
                  const isToday = day === today.getDate();
                  const isSelected = iso === selectedDate;
                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(iso)}
                      className={cn(
                        "min-h-12 md:min-h-20 rounded-md border p-1 md:p-1.5 text-left cursor-pointer transition-all flex flex-col justify-between select-none",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : isToday
                          ? "border-primary bg-primary/5 text-foreground"
                          : items.length > 0
                          ? "bg-primary/5 border-primary/20 text-foreground"
                          : "border-border text-foreground hover:bg-muted/30"
                      )}
                    >
                      <div className="text-xs font-semibold">{day}</div>
                      
                      {/* Desktop View: Show student names with different colors based on status */}
                      <div className="hidden md:block mt-1 space-y-1">
                        {items.slice(0, 2).map((v) => (
                          <div
                            key={v.id}
                            className={cn(
                              "truncate rounded px-1.5 py-0.5 text-[10px] font-medium border",
                              isSelected
                                ? "bg-primary-foreground/20 text-primary-foreground border-transparent"
                                : v.status === "Admission Confirmed"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-200/50"
                                : v.status === "Visit Scheduled"
                                ? "bg-amber-500/10 text-amber-700 border-amber-200/50"
                                : v.status === "Admission Rejected" || v.status === "Wrong Number"
                                ? "bg-rose-500/10 text-rose-700 border-rose-200/50"
                                : "bg-blue-500/10 text-blue-700 border-blue-200/50"
                            )}
                          >
                            {v.name}
                          </div>
                        ))}
                        {items.length > 2 && (
                          <div className={cn(
                            "text-[10px]",
                            isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                          )}>
                            +{items.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Mobile View: Show dot indicator with different status colors */}
                      <div className="md:hidden flex justify-center gap-1 mt-1 flex-wrap">
                        {items.map((v) => {
                          let dotColor = "bg-blue-500";
                          if (v.status === "Admission Confirmed") dotColor = "bg-emerald-500";
                          else if (v.status === "Visit Scheduled") dotColor = "bg-amber-500";
                          else if (v.status === "Admission Rejected" || v.status === "Wrong Number") dotColor = "bg-rose-500";

                          return (
                            <span
                              key={v.id}
                              className={cn(
                                "h-1.5 w-1.5 rounded-full transition-colors",
                                isSelected ? "bg-primary-foreground" : dotColor
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Details Section (highly visible on mobile) */}
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
                  <span>
                    Visits on {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <Badge variant="secondary">
                    {(byDay.get(selectedDate) ?? []).length} scheduled
                  </Badge>
                </h3>
                
                <div className="space-y-2">
                  {(byDay.get(selectedDate) ?? []).map((v) => (
                    <div 
                      key={v.id} 
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground">{v.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Course: <span className="font-medium text-foreground">{v.course}</span> · Counselor: <span className="font-medium text-foreground">{v.assignedTo}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusColor(v.status)}>
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                  {(byDay.get(selectedDate) ?? []).length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                      No campus visits scheduled for this date.
                    </div>
                  )}
                </div>
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
          {visits.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No visits currently scheduled.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}