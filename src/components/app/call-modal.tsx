import { useState } from "react";
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

export function CallUpdateModal({
  student,
  open,
  onOpenChange,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [status, setStatus] = useState<CallStatus>(student?.status ?? "Not Called");
  const [course, setCourse] = useState(student?.course ?? "");
  const [visit, setVisit] = useState(student?.visitDate ?? "");
  const [address, setAddress] = useState(student?.address ?? "");
  const [remarks, setRemarks] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Call — {student?.name}</DialogTitle>
          <DialogDescription>Log this call and update lead status.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
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
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Course Interested</Label>
              <Input value={course} onChange={(e) => setCourse(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Visit Date</Label>
              <Input type="date" value={visit ?? ""} onChange={(e) => setVisit(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Remarks</Label>
            <Textarea
              rows={3}
              placeholder="What happened on this call?"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success("Call logged", { description: `${student?.name} marked as ${status}.` });
              onOpenChange(false);
            }}
          >
            Save call
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}