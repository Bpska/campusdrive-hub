import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { statusColor } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { Loader2, Printer } from "lucide-react";

export const Route = createFileRoute("/_app/my-calls")({
  component: MyCallsPage,
});

function MyCallsPage() {
  const { data: calls = [], isLoading, error } = useQuery({
    queryKey: ["myCalls"],
    queryFn: studentApi.getCalls,
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My calls" 
        description="Every call you've logged, newest first." 
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print History
          </Button>
        }
      />
      <Card className="overflow-hidden border-border">
        {isLoading ? (
          <div className="flex py-20 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-destructive">
            Failed to load call history. Please try again.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap">{c.date}</TableCell>
                  <TableCell className="font-medium">{c.student}</TableCell>
                  <TableCell>{c.course}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(c.status)}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.remarks}</TableCell>
                </TableRow>
              ))}
              {calls.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No calls logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}