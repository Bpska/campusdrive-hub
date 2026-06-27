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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function StudentModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [exam, setExam] = useState<"JEE Main" | "OJEE" | "Special OJEE" | "Both">("OJEE");

  // Reset fields on open
  useEffect(() => {
    if (open) {
      setName("");
      setMobile("");
      setExam("OJEE");
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (newStudent: { name: string; mobile: string; exam: "JEE Main" | "OJEE" | "Special OJEE" | "Both" }) => 
      studentApi.create(newStudent as any),
    onSuccess: (data) => {
      toast.success("Lead created successfully", { description: `${data.name} added to pipeline.` });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create student lead");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      toast.error("Please enter both Name and Mobile number.");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      mobile: mobile.trim(),
      exam,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Lead</DialogTitle>
          <DialogDescription>Enter the student name and number to insert a new row in your pipeline.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="std-name">Student Full Name *</Label>
              <Input
                id="std-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Mohanty"
                required
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="std-mobile">Mobile Number *</Label>
              <Input
                id="std-mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. +91 9439012345"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="std-exam">Entrance Exam *</Label>
              <Select value={exam} onValueChange={(v) => setExam(v as any)}>
                <SelectTrigger id="std-exam">
                  <SelectValue placeholder="Select Entrance Exam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JEE Main">JEE Main</SelectItem>
                  <SelectItem value="OJEE">OJEE</SelectItem>
                  <SelectItem value="Special OJEE">Special OJEE</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
