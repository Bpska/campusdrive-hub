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
import { type Staff } from "@/lib/mock-data";
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
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { staffApi } from "@/lib/api";

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

  const handleSave = (staffData: { name: string; email: string; password?: string }) => {
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
    if (window.confirm(`Are you sure you want to permanently delete counselor "${s.name}"?`)) {
      deleteStaffMutation.mutate(s.id);
    }
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
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onSave: (s: { name: string; email: string; password?: string }) => void;
  isPending: boolean;
  editingStaff?: Staff | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Reset/populate state when opening
  useEffect(() => {
    if (open) {
      if (editingStaff) {
        setName(editingStaff.name);
        setEmail(editingStaff.email);
        setPassword("");
      } else {
        setName("");
        setEmail("");
        setPassword("");
      }
    }
  }, [open, editingStaff]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
          <Button
            onClick={() => onSave({ name, email, password: password || undefined })}
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