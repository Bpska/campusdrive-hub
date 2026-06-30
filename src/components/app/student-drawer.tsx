import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusColor } from "@/lib/mock-data";
import { CalendarDays, Mail, MapPin, Phone, PhoneCall, User, Loader2, Share2, Printer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { ShareModal } from "@/components/app/share-modal";

export function StudentDrawer({
  studentId,
  open,
  onOpenChange,
  onCall,
}: {
  studentId: string | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onCall: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const { data: student, isLoading } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => studentApi.get(studentId!),
    enabled: !!studentId && open,
  });

  if (!open) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-xl">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : student ? (
          <>
            <SheetHeader className="border-b border-border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {student.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate">{student.name}</SheetTitle>
                  <SheetDescription className="truncate">
                    {student.id} · {student.course}
                  </SheetDescription>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className={statusColor(student.status)}>
                      {student.status}
                    </Badge>
                    <Badge variant="outline">{student.exam}</Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={onCall} className="flex-1">
                  <PhoneCall className="mr-2 h-4 w-4" /> Log call
                </Button>
                <Button variant="outline" onClick={() => setShareOpen(true)} className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="flex-1">
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
              </div>
            </SheetHeader>

            <div className="space-y-6 p-6">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact details
                </h3>
                <div className="mt-3 space-y-2 text-sm">
                  <Row icon={User} label="Father's Name" value={student.fatherName} />
                  <Row icon={Phone} label="Mobile" value={
                    <a href={`tel:${student.mobile.replace(/\s+/g, '')}`} className="text-primary hover:underline font-medium">
                      {student.mobile}
                    </a>
                  } />
                  <Row icon={MapPin} label="Address" value={student.address} />
                  <Row
                    icon={CalendarDays}
                    label="Visit Date"
                    value={student.visitDate ?? "Not scheduled"}
                  />
                  <Row icon={User} label="Assigned To" value={student.assignedTo} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Remarks
                </h3>
                <p className="mt-2 rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground">
                  {student.remarks}
                </p>
              </section>

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Call history
                </h3>
                <ol className="mt-3 space-y-3 border-l border-border pl-4">
                  {(student.history || []).map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-card" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={statusColor(h.status)}>
                          {h.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{h.date}</span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">{h.remarks}</p>
                      <p className="text-xs text-muted-foreground">by {h.by}</p>
                    </li>
                  ))}
                  {(student.history || []).length === 0 && (
                    <div className="py-2 text-sm text-muted-foreground">
                      No calls logged yet.
                    </div>
                  )}
                </ol>
              </section>
            </div>
            
            <ShareModal
              open={shareOpen}
              onOpenChange={setShareOpen}
              student={student}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Student details not found.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}