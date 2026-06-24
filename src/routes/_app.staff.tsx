import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
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
import { STAFF, type Staff } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { Pencil, Plus, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/_app/staff")({
  component: StaffPage,
});

function StaffPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Staff[]>(STAFF);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [open, setOpen] = useState(false);

  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  const save = (s: Staff) => {
    setList((prev) => {
      const exists = prev.find((p) => p.id === s.id);
      return exists ? prev.map((p) => (p.id === s.id ? s : p)) : [s, ...prev];
    });
    toast.success("Staff saved");
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff management"
        description="Manage counsellors and their lead assignments."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add staff
          </Button>
        }
      />
      <Card className="overflow-hidden border-border">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setEditing(s); setOpen(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setList((p) => p.filter((x) => x.id !== s.id)); toast.success("Staff removed"); }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <StaffForm
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={save}
      />
    </div>
  );
}

function StaffForm({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  initial: Staff | null;
  onSave: (s: Staff) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit staff" : "Add staff"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ravi Kapoor" />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ravi@crm.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() =>
              onSave({
                id: initial?.id ?? `STF${Math.floor(Math.random() * 9000) + 1000}`,
                name,
                email,
                assignedLeads: initial?.assignedLeads ?? 0,
                callsMade: initial?.callsMade ?? 0,
                status: initial?.status ?? "Active",
              })
            }
          >
            Save staff
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}