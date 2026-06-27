import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CALL_STATUSES, type CallStatus, type Student } from "@/lib/mock-data";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { Loader2, Phone } from "lucide-react";

const COURSES = [
  "B.Tech CSE",
  "B.Tech ECE",
  "B.Tech Mechanical",
  "B.Tech Civil",
  "BBA",
  "MBA",
  "B.Pharm",
  "BCA",
];

const SOURCES = [
  "Website",
  "Walk-in",
  "Referral",
  "Google Ads",
  "Facebook",
  "Education Fair",
  "Newspaper",
];

export function CallUpdateModal({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [status, setStatus] = useState<CallStatus>("Not Called");
  const [course, setCourse] = useState("");
  const [visit, setVisit] = useState("");
  const [address, setAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [exam, setExam] = useState<"JEE Main" | "OJEE" | "Special OJEE" | "Both">("JEE Main");

  const queryClient = useQueryClient();

  // Reset fields when student changes or modal opens
  useEffect(() => {
    if (student) {
      setStatus(student.status || "Not Called");
      setCourse(student.course || "");
      setVisit(student.visitDate || "");
      setAddress(student.address || "");
      setRemarks("");
      setFatherName(student.fatherName || "");
      setExam(student.exam || "JEE Main");
    }
  }, [student, open]);

  const logCallMutation = useMutation({
    mutationFn: (data: {
      status: CallStatus;
      remarks: string;
      course?: string;
      visitDate?: string | null;
      address?: string;
      fatherName?: string;
      exam?: "JEE Main" | "OJEE" | "Special OJEE" | "Both";
    }) => {
      return studentApi.logCall(student!.id, data);
    },
    onSuccess: (data) => {
      toast.success("Call logged and details updated", { description: `${student?.name} marked as ${data.status}.` });
      
      // Invalidate relevant queries to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", student?.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to log call");
    },
  });

  const handleSave = () => {
    if (!student) return;
    
    logCallMutation.mutate({
      status,
      remarks,
      course,
      visitDate: visit || null,
      address,
      fatherName,
      exam,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Call & Details — {student?.name}</DialogTitle>
          <DialogDescription>Log the call results and complete the student's sheet profile details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Quick Call Action Card for Mobile & Direct Dialing */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/65 hover:bg-muted/90 transition-colors rounded-lg p-3.5 border border-border">
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Mobile Number</span>
              <div className="font-bold text-foreground text-base tracking-wide">{student?.mobile}</div>
            </div>
            <Button asChild size="sm" className="gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold">
              <a href={`tel:${student?.mobile?.replace(/\s+/g, '')}`}>
                <Phone className="h-4 w-4" />
                Call Now
              </a>
            </Button>
          </div>

          {/* Call Logging Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Call Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CallStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Visit Date</Label>
              <Input type="date" value={visit || ""} onChange={(e) => setVisit(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Remarks / Conversation Notes</Label>
            <Textarea
              rows={2}
              placeholder="What did you talk about during this call?"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Student Profile Sheet Details
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          {/* Student Profile Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Father's Name</Label>
              <Input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Father's full name" />
            </div>
            <div className="grid gap-2">
              <Label>Entrance Exam</Label>
              <Select value={exam} onValueChange={(v) => setExam(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JEE Main">JEE Main</SelectItem>
                  <SelectItem value="OJEE">OJEE</SelectItem>
                  <SelectItem value="Special OJEE">Special OJEE</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Course Interest</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Permanent Address</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Bhubaneswar, Odisha" />
            </div>
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={logCallMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={logCallMutation.isPending}
          >
            {logCallMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save call & details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}