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

const PRESET_COURSES = [
  "B.Tech CSE",
  "B.Tech ECE",
  "B.Tech Mechanical",
  "B.Tech Civil",
  "BBA",
  "MBA",
  "B.Pharm",
  "BCA",
];

/** Hybrid course selector: dropdown preset list + free-text "Other" entry */
function CourseField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Determine if current value is one of the presets or a custom entry
  const isCustom = value !== "" && !PRESET_COURSES.includes(value);
  const [selectVal, setSelectVal] = useState<string>(isCustom ? "__other__" : value);
  const [customVal, setCustomVal] = useState<string>(isCustom ? value : "");

  // Keep parent in sync whenever selection or custom text changes
  const handleSelectChange = (v: string) => {
    setSelectVal(v);
    if (v === "__other__") {
      onChange(customVal);
    } else {
      setCustomVal("");
      onChange(v);
    }
  };

  const handleCustomChange = (v: string) => {
    setCustomVal(v);
    onChange(v);
  };

  // Sync when parent resets value to ""
  useEffect(() => {
    if (value === "") {
      setSelectVal("");
      setCustomVal("");
    }
  }, [value]);

  return (
    <div className="grid gap-2">
      <Select value={selectVal} onValueChange={handleSelectChange}>
        <SelectTrigger id="std-course">
          <SelectValue placeholder="Select or type course…" />
        </SelectTrigger>
        <SelectContent>
          {PRESET_COURSES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
          <SelectItem value="__other__">Other – type manually</SelectItem>
        </SelectContent>
      </Select>
      {selectVal === "__other__" && (
        <Input
          value={customVal}
          onChange={(e) => handleCustomChange(e.target.value)}
          placeholder="e.g. M.Tech, LLB, B.Ed…"
          autoFocus
        />
      )}
    </div>
  );
}

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
  const [course, setCourse] = useState("");

  // Reset fields on open
  useEffect(() => {
    if (open) {
      setName("");
      setMobile("");
      setExam("OJEE");
      setCourse("");
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: (newStudent: {
      name: string;
      mobile: string;
      exam: "JEE Main" | "OJEE" | "Special OJEE" | "Both";
      course?: string;
    }) => studentApi.create(newStudent as any),
    onSuccess: (data) => {
      toast.success("Lead created successfully", {
        description: `${data.name} added to pipeline.`,
      });
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
      course: course.trim() || undefined,
    });
  };

  // Listen for Ctrl+S / Cmd+S to save
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!name.trim() || !mobile.trim()) {
          toast.error("Please enter both Name and Mobile number.");
          return;
        }
        createMutation.mutate({
          name: name.trim(),
          mobile: mobile.trim(),
          exam,
          course: course.trim() || undefined,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, name, mobile, exam, course, createMutation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Lead</DialogTitle>
          <DialogDescription>
            Enter the student details to insert a new row in your pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 py-2">
          <div className="grid gap-4">
            {/* Name */}
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

            {/* Mobile */}
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

            {/* Entrance Exam */}
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

            {/* Course Interest — dropdown + manual entry */}
            <div className="grid gap-2">
              <Label htmlFor="std-course">
                Course Interest{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional — choose preset or type your own)
                </span>
              </Label>
              <CourseField value={course} onChange={setCourse} />
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
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
