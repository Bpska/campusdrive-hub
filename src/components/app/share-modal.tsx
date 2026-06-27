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
import { Mail, PhoneCall } from "lucide-react";

export function ShareModal({
  student,
  open,
  onOpenChange,
}: {
  student: any;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const [mobileNum, setMobileNum] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (student) {
      setMobileNum(student.mobile || "");
      setEmail("");
    }
  }, [student, open]);

  if (!student) return null;

  const handleWhatsApp = () => {
    if (!mobileNum.trim()) return;
    const formattedMobile = mobileNum.replace(/\+/g, "").replace(/\s+/g, "");
    const text = encodeURIComponent(
      `*Lead Details: ${student.name}*\n\n` +
      `• *ID:* ${student.id}\n` +
      `• *Mobile:* ${student.mobile}\n` +
      `• *Father's Name:* ${student.fatherName || "N/A"}\n` +
      `• *Address:* ${student.address || "N/A"}\n` +
      `• *Entrance Exam:* ${student.exam}\n` +
      `• *Course Interest:* ${student.course}\n` +
      `• *Current Status:* ${student.status}\n` +
      `• *Visit Date:* ${student.visitDate || "Not scheduled"}\n` +
      `• *Remarks:* ${student.remarks || "No remarks."}\n`
    );
    window.open(`https://wa.me/${formattedMobile}?text=${text}`, "_blank");
    onOpenChange(false);
  };

  const handleEmail = () => {
    if (!email.trim()) return;
    const subject = encodeURIComponent(`Lead Details: ${student.name}`);
    const body = encodeURIComponent(
      `Here are the lead details for ${student.name}:\n\n` +
      `Name: ${student.name}\n` +
      `ID: ${student.id}\n` +
      `Mobile: ${student.mobile}\n` +
      `Father's Name: ${student.fatherName || "N/A"}\n` +
      `Address: ${student.address || "N/A"}\n` +
      `Entrance Exam: ${student.exam}\n` +
      `Course Interest: ${student.course}\n` +
      `Current Status: ${student.status}\n` +
      `Visit Date: ${student.visitDate || "Not scheduled"}\n` +
      `Remarks: ${student.remarks || "No remarks."}\n`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Lead Details</DialogTitle>
          <DialogDescription>
            Share {student.name}'s details via WhatsApp or Email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="share-mobile">WhatsApp Mobile Number</Label>
              <div className="flex gap-2">
                <Input
                  id="share-mobile"
                  value={mobileNum}
                  onChange={(e) => setMobileNum(e.target.value)}
                  placeholder="e.g. 919439012345"
                />
                <Button
                  onClick={handleWhatsApp}
                  disabled={!mobileNum.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-2"
                >
                  <PhoneCall className="h-4 w-4" /> Share WhatsApp
                </Button>
              </div>
            </div>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase font-semibold">
                or
              </span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="share-email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="share-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recipient@example.com"
                />
                <Button
                  onClick={handleEmail}
                  disabled={!email.trim()}
                  variant="outline"
                  className="shrink-0 gap-2"
                >
                  <Mail className="h-4 w-4" /> Share Email
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
