import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { type Staff, CALL_STATUSES } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { Plus, ToggleLeft, ToggleRight, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi, studentApi } from "@/lib/api";

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

export const Route = createFileRoute("/_app/staff")({
  component: StaffPage,
});

function StaffPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const queryClient = useQueryClient();

  const { data: list = [], isLoading, error } = useQuery({
    queryKey: ["staff"],
    queryFn: staffApi.list,
  });

  const { data: studentsData } = useQuery({
    queryKey: ["students-districts-lookup"],
    queryFn: () => studentApi.list({ limit: 1 }),
  });
  const uploadedDistricts = studentsData?.districts || [];
  const uploadedCourses = studentsData?.courses || [];

  const createStaffMutation = useMutation({
    mutationFn: (data: { name: string; email: string; password?: string; status: "Active" | "Inactive" }) => {
      return staffApi.create(data);
    },
    onSuccess: () => {
      toast.success("Staff added successfully");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add staff");
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; email?: string; password?: string } }) => {
      return staffApi.update(id, data);
    },
    onSuccess: () => {
      toast.success("Staff updated successfully");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      setOpen(false);
      setEditingStaff(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update staff");
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => {
      return staffApi.delete(id);
    },
    onSuccess: () => {
      toast.success("Staff deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete staff");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "Active" | "Inactive" }) => {
      return staffApi.updateStatus(id, status);
    },
    onSuccess: (data) => {
      toast.success(`Staff marked as ${data.status}`);
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update staff status");
    },
  });

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const handleSave = (staffData: { name: string; email: string; password?: string; assignedDistricts?: string; assignedSteps?: string; assignedCourses?: string }) => {
    if (editingStaff) {
      updateStaffMutation.mutate({
        id: editingStaff.id,
        data: staffData,
      });
    } else {
      createStaffMutation.mutate({
        ...staffData,
        status: "Active",
      });
    }
  };

  const handleAddClick = () => {
    setEditingStaff(null);
    setOpen(true);
  };

  const handleEditClick = (s: Staff) => {
    setEditingStaff(s);
    setOpen(true);
  };

  const handleDeleteClick = (s: Staff) => {
    deleteStaffMutation.mutate(s.id);
  };

  const handleToggleStatus = (s: Staff) => {
    const nextStatus = s.status === "Active" ? "Inactive" : "Active";
    toggleStatusMutation.mutate({ id: s.id, status: nextStatus });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff management"
        description="Manage counsellors and their lead assignments."
        actions={
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" /> Add staff
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
            Error loading staff. Please try again.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Staff</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Districts</TableHead>
                <TableHead>Assigned Steps</TableHead>
                <TableHead>Assigned Courses</TableHead>
                <TableHead>Assigned leads</TableHead>
                <TableHead>Calls made</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    {s.assignedDistricts ? (
                      <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 block max-w-[150px] truncate" title={s.assignedDistricts}>
                        {s.assignedDistricts}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">All Districts</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.assignedSteps ? (
                      <span className="text-xs font-semibold bg-violet-50 text-violet-700 px-2 py-1 rounded border border-violet-100 block max-w-[150px] truncate" title={s.assignedSteps}>
                        {s.assignedSteps}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">All Steps</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.assignedCourses ? (
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 block max-w-[150px] truncate" title={s.assignedCourses}>
                        {s.assignedCourses}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">All Courses</span>
                    )}
                  </TableCell>
                  <TableCell>{s.assignedLeads}</TableCell>
                  <TableCell>{s.callsMade}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        s.status === "Active"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }
                    >
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit counselor"
                        onClick={() => handleEditClick(s)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={s.status === "Active" ? "Deactivate counselor" : "Activate counselor"}
                        onClick={() => handleToggleStatus(s)}
                      >
                        {s.status === "Active" ? (
                          <ToggleRight className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete counselor"
                        onClick={() => handleDeleteClick(s)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive hover:text-destructive/80" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No staff members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
      <StaffForm
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setEditingStaff(null);
        }}
        onSave={handleSave}
        isPending={createStaffMutation.isPending || updateStaffMutation.isPending}
        editingStaff={editingStaff}
        uploadedDistricts={uploadedDistricts}
        uploadedCourses={uploadedCourses}
      />
    </div>
  );
}

function StaffForm({
  open,
  onOpenChange,
  onSave,
  isPending,
  editingStaff,
  uploadedDistricts,
  uploadedCourses,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onSave: (s: { name: string; email: string; password?: string; assignedDistricts?: string; assignedSteps?: string; assignedCourses?: string }) => void;
  isPending: boolean;
  editingStaff?: Staff | null;
  uploadedDistricts: string[];
  uploadedCourses: string[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [customDistrict, setCustomDistrict] = useState("");
  const [customCourse, setCustomCourse] = useState("");

  // Reset/populate state when opening
  useEffect(() => {
    if (open) {
      if (editingStaff) {
        setName(editingStaff.name);
        setEmail(editingStaff.email);
        setPassword("");
        setSelectedDistricts(
          editingStaff.assignedDistricts
            ? editingStaff.assignedDistricts.split(",").map((s) => s.trim()).filter(Boolean)
            : []
        );
        setSelectedSteps(
          editingStaff.assignedSteps
            ? editingStaff.assignedSteps.split(",").map((s) => s.trim()).filter(Boolean)
            : []
        );
        setSelectedCourses(
          editingStaff.assignedCourses
            ? editingStaff.assignedCourses.split(",").map((s) => s.trim()).filter(Boolean)
            : []
        );
      } else {
        setName("");
        setEmail("");
        setPassword("");
        setSelectedDistricts([]);
        setSelectedSteps([]);
        setSelectedCourses([]);
      }
    }
  }, [open, editingStaff]);

  const handleDistrictToggle = (district: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(district) ? prev.filter((d) => d !== district) : [...prev, district]
    );
  };

  const handleStepToggle = (step: string) => {
    setSelectedSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  };

  const handleCourseToggle = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course) ? prev.filter((c) => c !== course) : [...prev, course]
    );
  };

  // Listen for Ctrl+S / Cmd+S to save
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!name.trim() || !email.trim() || (!editingStaff && !password.trim())) {
          toast.error("Please fill in all required fields.");
          return;
        }
        onSave({
          name,
          email,
          password: password || undefined,
          assignedDistricts: selectedDistricts.join(","),
          assignedSteps: selectedSteps.join(","),
          assignedCourses: selectedCourses.join(","),
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, name, email, password, selectedDistricts, selectedSteps, selectedCourses, editingStaff, onSave]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingStaff ? "Edit staff counselor" : "Add staff counselor"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anita Desai" required />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anita@crm.com" required />
          </div>
          <div className="grid gap-2">
            <Label className="flex justify-between">
              <span>Password</span>
              {editingStaff && <span className="text-xs text-muted-foreground font-normal">(leave blank to keep current)</span>}
            </Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required={!editingStaff}
            />
          </div>
          <div className="grid gap-2 border-t pt-3">
            <Label className="font-semibold text-foreground">Assigned Districts</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-2 bg-muted/20">
              {Array.from(new Set([...uploadedDistricts, ...selectedDistricts])).map((district) => (
                <label key={district} className="flex items-center gap-2 text-xs font-medium cursor-pointer py-1 px-1.5 rounded hover:bg-muted">
                  <Checkbox
                    checked={selectedDistricts.includes(district)}
                    onCheckedChange={() => handleDistrictToggle(district)}
                  />
                  <span>{district}</span>
                </label>
              ))}
              {uploadedDistricts.length === 0 && selectedDistricts.length === 0 && (
                <span className="text-xs text-muted-foreground p-1 col-span-2">No districts found. Add a custom one below.</span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Input
                value={customDistrict}
                onChange={(e) => setCustomDistrict(e.target.value)}
                placeholder="Custom district..."
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customDistrict.trim()) {
                      if (!selectedDistricts.includes(customDistrict.trim())) {
                        setSelectedDistricts([...selectedDistricts, customDistrict.trim()]);
                      }
                      setCustomDistrict("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => {
                  if (customDistrict.trim()) {
                    if (!selectedDistricts.includes(customDistrict.trim())) {
                      setSelectedDistricts([...selectedDistricts, customDistrict.trim()]);
                    }
                    setCustomDistrict("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Select specific districts this staff can view. Uncheck all to allow access to all districts.
            </span>
          </div>
          <div className="grid gap-2 border-t pt-3">
            <Label className="font-semibold text-foreground">Assigned Funnel Steps</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-2 bg-muted/20">
              {CALL_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-2 text-xs font-medium cursor-pointer py-1 px-1.5 rounded hover:bg-muted">
                  <Checkbox
                    checked={selectedSteps.includes(status)}
                    onCheckedChange={() => handleStepToggle(status)}
                  />
                  <span>{status}</span>
                </label>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">
              Select specific lead statuses this staff can see. Uncheck all to allow access to all statuses.
            </span>
          </div>
          <div className="grid gap-2 border-t pt-3">
            <Label className="font-semibold text-foreground">Assigned Courses</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border rounded-md p-2 bg-muted/20">
              {Array.from(new Set([...uploadedCourses, ...selectedCourses])).map((course) => (
                <label key={course} className="flex items-center gap-2 text-xs font-medium cursor-pointer py-1 px-1.5 rounded hover:bg-muted">
                  <Checkbox
                    checked={selectedCourses.includes(course)}
                    onCheckedChange={() => handleCourseToggle(course)}
                  />
                  <span>{course}</span>
                </label>
              ))}
              {uploadedCourses.length === 0 && selectedCourses.length === 0 && (
                <span className="text-xs text-muted-foreground p-1 col-span-2">No courses found. Add a custom one below.</span>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Input
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                placeholder="Custom course..."
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customCourse.trim()) {
                      if (!selectedCourses.includes(customCourse.trim())) {
                        setSelectedCourses([...selectedCourses, customCourse.trim()]);
                      }
                      setCustomCourse("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-3"
                onClick={() => {
                  if (customCourse.trim()) {
                    if (!selectedCourses.includes(customCourse.trim())) {
                      setSelectedCourses([...selectedCourses, customCourse.trim()]);
                    }
                    setCustomCourse("");
                  }
                }}
              >
                Add
              </Button>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Select specific courses this staff can manage. Uncheck all to allow access to all courses.
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button
            onClick={() =>
              onSave({
                name,
                email,
                password: password || undefined,
                assignedDistricts: selectedDistricts.join(","),
                assignedSteps: selectedSteps.join(","),
                assignedCourses: selectedCourses.join(","),
              })
            }
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}