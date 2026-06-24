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
import { STUDENTS, statusColor } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/my-calls")({
  component: MyCallsPage,
});

function MyCallsPage() {
  const calls = STUDENTS.slice(0, 14).flatMap((s) =>
    s.history.map((h) => ({ student: s.name, course: s.course, ...h })),
  );
  return (
    <div className="space-y-6">
      <PageHeader title="My calls" description="Every call you've logged, newest first." />
      <Card className="overflow-hidden border-border">
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
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}