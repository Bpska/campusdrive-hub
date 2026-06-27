import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { activityApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ["activities"],
    queryFn: activityApi.list,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Activity log" description="Every action across your team, newest first." />
      <Card className="border-border">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex py-12 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-destructive">
              Failed to load activity log. Please try again.
            </div>
          ) : (
            <ol className="space-y-5 border-l border-border pl-5">
              {activities.map((a) => (
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
              {activities.length === 0 && (
                <div className="py-6 text-center text-muted-foreground">
                  No action log recorded yet.
                </div>
              )}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}