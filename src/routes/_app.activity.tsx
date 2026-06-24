import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ACTIVITIES } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Activity log" description="Every action across your team, newest first." />
      <Card className="border-border">
        <CardContent className="p-6">
          <ol className="space-y-5 border-l border-border pl-5">
            {ACTIVITIES.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[26px] top-2 h-3 w-3 rounded-full bg-primary ring-4 ring-card" />
                <div className="text-sm text-foreground">
                  <span className="font-medium">{a.actor}</span>{" "}
                  <span className="text-muted-foreground">{a.action}</span>{" "}
                  <span className="font-medium">{a.target}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.time).toLocaleString()}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}