import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { CALL_STATUSES, statusColor, type Student } from "@/lib/mock-data";
import { ChevronLeft, ChevronRight, Download, Search, Upload, Loader2, Plus, Phone, Trash2, Pencil, Check, X, Mail, Share2 } from "lucide-react";
import { StudentDrawer } from "@/components/app/student-drawer";
import { CallUpdateModal } from "@/components/app/call-modal";
import { StudentModal } from "@/components/app/student-modal";
import { ShareModal } from "@/components/app/share-modal";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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

export const Route = createFileRoute("/_app/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [examFilter, setExamFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("name");
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStudent, setShareStudent] = useState<Student | null>(null);
  const pageSize = 8;

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["students", { query, statusFilter, examFilter, sortKey, page }],
    queryFn: () => studentApi.list({ q: query, status: statusFilter, exam: examFilter, sort: sortKey, page, limit: pageSize }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentApi.delete(id),
    onSuccess: () => {
      toast.success("Lead deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete lead");
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editExam, setEditExam] = useState<"JEE Main" | "OJEE" | "Special OJEE" | "Both">("JEE Main");
  const [editCourse, setEditCourse] = useState("");
  const [editVisitDate, setEditVisitDate] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<any>("Not Called");
  const [editRemarks, setEditRemarks] = useState("");

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) => studentApi.update(id, data),
    onSuccess: () => {
      toast.success("Student updated successfully");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update student");
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: (students: any[]) => studentApi.bulkCreate(students),
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.count} leads!`, {
        description: "The pipeline has been updated."
      });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to bulk upload leads.");
    }
  });

  const handleExport = () => {
    studentApi.list({ limit: 1000 }).then((res) => {
      const headers = [
        "Student ID",
        "Student Name",
        "Father's Name",
        "Mobile Number",
        "Address",
        "Entrance Exam",
        "Course Interest",
        "Visit Date",
        "Status",
        "Remarks",
        "Assigned Counselor"
      ];
      
      const rows = res.students.map((s) => [
        s.id,
        s.name,
        s.fatherName || "",
        s.mobile,
        s.address || "",
        s.exam,
        s.course,
        s.visitDate || "",
        s.status,
        s.remarks || "",
        s.assignedTo
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `student_leads_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }).catch((err) => {
      toast.error("Failed to export leads: " + err.message);
    });
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    const result = [];
    if (lines.length === 0 || !lines[0].trim()) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const row = [];
      let insideQuote = false;
      let entry = "";
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === "," && !insideQuote) {
          row.push(entry.trim().replace(/^["']|["']$/g, ""));
          entry = "";
        } else {
          entry += char;
        }
      }
      row.push(entry.trim().replace(/^["']|["']$/g, ""));
      
      if (row.length > 0) {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        result.push(obj);
      }
    }
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      try {
        const rawRows = parseCSV(text);
        if (rawRows.length === 0) {
          toast.error("CSV file is empty or invalid.");
          return;
        }
        
        const studentsToUpload = rawRows.map((row) => {
          const getVal = (aliases: string[]) => {
            const key = Object.keys(row).find((k) => 
              aliases.includes(k.toLowerCase().trim())
            );
            return key ? row[key] : undefined;
          };
          
          return {
            name: getVal(["name", "student name", "student_name", "full name", "fullname"]),
            mobile: getVal(["mobile", "mobile number", "mobile_number", "phone", "number", "phone number", "phone_number"]),
            fatherName: getVal(["father name", "father's name", "father_name", "fathername"]),
            address: getVal(["address", "city", "permanent address"]),
            exam: getVal(["exam", "entrance exam", "entrance_exam"]),
            course: getVal(["course", "course interest", "course_interest"]),
            status: getVal(["status", "call status", "call_status"]),
            remarks: getVal(["remarks", "notes", "conversation notes", "remarks / conversation notes"]),
            assignedTo: getVal(["assigned to", "assigned_to", "counselor", "assigned counselor"])
          };
        }).filter(s => s.name && s.mobile);
        
        if (studentsToUpload.length === 0) {
          toast.error("No valid leads found. CSV must contain 'Name' and 'Mobile' columns.");
          return;
        }
        
        bulkUploadMutation.mutate(studentsToUpload as any);
      } catch (err) {
        toast.error("Failed to parse CSV: " + (err as any).message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const students = data?.students || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const activeStudent = students.find((s) => s.id === activeId) || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${total} leads in your pipeline.`}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button
              onClick={() => document.getElementById("bulk-upload-input")?.click()}
              disabled={bulkUploadMutation.isPending}
            >
              {bulkUploadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Bulk upload
            </Button>
            <input
              type="file"
              id="bulk-upload-input"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </>
        }
      />

      <Card className="border-border p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
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
          <Select value={examFilter} onValueChange={(v) => { setExamFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              <SelectItem value="JEE Main">JEE Main</SelectItem>
              <SelectItem value="OJEE">OJEE</SelectItem>
              <SelectItem value="Special OJEE">Special OJEE</SelectItem>
              <SelectItem value="Both">Both</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v)}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="status">Sort: Status</SelectItem>
              <SelectItem value="course">Sort: Course</SelectItem>
              <SelectItem value="visit_date">Sort: Visit date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden border-border">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex py-20 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-20 text-center text-destructive">
              Error loading students. Please try again.
            </div>
          ) : (
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const isEditing = s.id === editingId;
                  return (
                    <TableRow
                      key={s.id}
                      className={isEditing ? "bg-muted/30 hover:bg-muted/30" : "cursor-pointer"}
                      onClick={() => !isEditing && setActiveId(s.id)}
                    >
                      <TableCell>
                        {isEditing ? (
                          <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 w-full min-w-[100px] px-2 py-1 text-xs"
                            />
                            <div className="text-[10px] text-muted-foreground">{s.id}</div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-foreground">{s.name}</div>
                            <div className="text-xs text-muted-foreground">{s.id}</div>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editFatherName}
                            onChange={(e) => setEditFatherName(e.target.value)}
                            className="h-8 w-full min-w-[100px] px-2 py-1 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          s.fatherName
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <Input
                            value={editMobile}
                            onChange={(e) => setEditMobile(e.target.value)}
                            className="h-8 w-full min-w-[100px] px-2 py-1 text-xs"
                          />
                        ) : (
                          <a href={`tel:${s.mobile.replace(/\s+/g, '')}`} className="text-primary hover:underline font-medium">
                            {s.mobile}
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {isEditing ? (
                          <Input
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="h-8 w-full min-w-[120px] px-2 py-1 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          s.address
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                           <Select value={editExam} onValueChange={(v) => setEditExam(v as any)}>
                             <SelectTrigger className="h-8 w-28 px-2 py-1 text-xs">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="JEE Main">JEE Main</SelectItem>
                               <SelectItem value="OJEE">OJEE</SelectItem>
                               <SelectItem value="Special OJEE">Special OJEE</SelectItem>
                               <SelectItem value="Both">Both</SelectItem>
                             </SelectContent>
                           </Select>
                        ) : (
                          s.exam
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <Select value={editCourse} onValueChange={setEditCourse}>
                            <SelectTrigger className="h-8 w-28 px-2 py-1 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COURSES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          s.course
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            type="date"
                            value={editVisitDate || ""}
                            onChange={(e) => setEditVisitDate(e.target.value || null)}
                            className="h-8 w-32 px-2 py-1 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          s.visitDate ?? <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <Select value={editStatus} onValueChange={setEditStatus}>
                            <SelectTrigger className="h-8 w-32 px-2 py-1 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CALL_STATUSES.map((statusItem) => (
                                <SelectItem key={statusItem} value={statusItem}>{statusItem}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={statusColor(s.status)}>
                            {s.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-muted-foreground">
                        {isEditing ? (
                          <Input
                            value={editRemarks}
                            onChange={(e) => setEditRemarks(e.target.value)}
                            className="h-8 w-full min-w-[150px] px-2 py-1 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          s.remarks
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Save changes"
                                onClick={() => {
                                  updateMutation.mutate({
                                    id: s.id,
                                    data: {
                                      name: editName,
                                      fatherName: editFatherName,
                                      mobile: editMobile,
                                      address: editAddress,
                                      exam: editExam,
                                      course: editCourse,
                                      visitDate: editVisitDate,
                                      status: editStatus,
                                      remarks: editRemarks,
                                    },
                                  });
                                }}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                title="Cancel"
                                onClick={() => setEditingId(null)}
                                disabled={updateMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                title="Call & Update"
                                onClick={() => {
                                  setActiveId(s.id);
                                  setCallOpen(true);
                                }}
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                title="Edit inline"
                                onClick={() => {
                                  setEditingId(s.id);
                                  setEditName(s.name);
                                  setEditFatherName(s.fatherName);
                                  setEditMobile(s.mobile);
                                  setEditAddress(s.address);
                                  setEditExam(s.exam);
                                  setEditCourse(s.course);
                                  setEditVisitDate(s.visitDate);
                                  setEditStatus(s.status);
                                  setEditRemarks(s.remarks);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                title="Share Details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShareStudent(s);
                                  setShareOpen(true);
                                }}
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              {user?.role === "admin" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Delete Lead"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${s.name}?`)) {
                                      deleteMutation.mutate(s.id);
                                    }
                                  }}
                                  disabled={deleteMutation.isPending}
                                >
                                  {deleteMutation.isPending && deleteMutation.variables === s.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">
                      No students match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
        {!isLoading && !error && (
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
        )}
      </Card>

      <StudentDrawer
        studentId={activeId}
        open={!!activeId}
        onOpenChange={(b) => !b && setActiveId(null)}
        onCall={() => setCallOpen(true)}
      />
      <CallUpdateModal key={activeId} student={activeStudent} open={callOpen} onOpenChange={setCallOpen} />
      <StudentModal open={addOpen} onOpenChange={setAddOpen} />
      <ShareModal open={shareOpen} onOpenChange={setShareOpen} student={shareStudent} />
    </div>
  );
}