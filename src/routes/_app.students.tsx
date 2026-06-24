import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CALL_STATUSES, STUDENTS, statusColor, type Student } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Download, Search, Upload } from "lucide-react";
import { StudentDrawer } from "@/components/app/student-drawer";
import { CallUpdateModal } from "@/components/app/call-modal";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<keyof Student>("name");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<Student | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const pageSize = 8;

  const filtered = useMemo(() => {
    let r = STUDENTS.filter((s) => {
      const q = query.toLowerCase();
      const matches =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.mobile.includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        s.course.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matches && matchStatus;
    });
    r = [...r].sort((a, b) =>
      String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? "")),
    );
    return r;
  }, [query, statusFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${filtered.length} leads in your pipeline.`}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Exported CSV")}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button onClick={() => toast.success("Bulk upload ready")}>
              <Upload className="mr-2 h-4 w-4" /> Bulk upload
            </Button>
          </>
        }
      />

      <Card className="border-border p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, mobile, course…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {CALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as keyof Student)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="status">Sort: Status</SelectItem>
              <SelectItem value="course">Sort: Course</SelectItem>
              <SelectItem value="visitDate">Sort: Visit date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Student</TableHead>
                <TableHead>Father's Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Exam</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {current.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => setActive(s)}
                >
                  <TableCell>
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.id}</div>
                  </TableCell>
                  <TableCell>{s.fatherName}</TableCell>
                  <TableCell className="whitespace-nowrap">{s.mobile}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{s.address}</TableCell>
                  <TableCell>{s.exam}</TableCell>
                  <TableCell>{s.course}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {s.visitDate ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor(s.status)}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground">
                    {s.remarks}
                  </TableCell>
                </TableRow>
              ))}
              {current.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    No students match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3 text-sm">
          <div className="text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <StudentDrawer
        student={active}
        open={!!active}
        onOpenChange={(b) => !b && setActive(null)}
        onCall={() => setCallOpen(true)}
      />
      <CallUpdateModal student={active} open={callOpen} onOpenChange={setCallOpen} />
    </div>
  );
}