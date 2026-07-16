import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
import { ChevronLeft, ChevronRight, Download, Search, Upload, Loader2, Plus, Phone, Trash2, Pencil, Check, X, Mail, Share2, Clipboard, Printer, Pin, CheckCircle2 } from "lucide-react";
import { StudentDrawer } from "@/components/app/student-drawer";
import { CallUpdateModal } from "@/components/app/call-modal";
import { StudentModal } from "@/components/app/student-modal";
import { ShareModal } from "@/components/app/share-modal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const PRESET_COURSES = [
  "B.TECH",
  "M.TECH",
  "MBA",
  "MCA",
  "BBA",
  "BCA",
  "M.SC",
  "MBA (HR)",
  "MBA (FM)",
  "MBA (MM)",
];

/** Inline hybrid course selector for table row editing */
function InlineCourseField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const isCustom = value !== "" && !PRESET_COURSES.includes(value);
  const [selectVal, setSelectVal] = useState<string>(isCustom ? "__other__" : value);
  const [customVal, setCustomVal] = useState<string>(isCustom ? value : "");

  const handleSelectChange = (v: string) => {
    setSelectVal(v);
    if (v === "__other__") {
      onChange(customVal);
    } else {
      setCustomVal("");
      onChange(v);
    }
  };

  useEffect(() => {
    const newIsCustom = value !== "" && !PRESET_COURSES.includes(value);
    if (newIsCustom) {
      setSelectVal("__other__");
      setCustomVal(value);
    } else {
      setSelectVal(value);
      setCustomVal("");
    }
  }, [value]);

  return (
    <div className="space-y-1">
      <Select value={selectVal} onValueChange={handleSelectChange}>
        <SelectTrigger className="h-8 w-28 px-2 py-1 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESET_COURSES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
          <SelectItem value="__other__">Other…</SelectItem>
        </SelectContent>
      </Select>
      {selectVal === "__other__" && (
        <Input
          value={customVal}
          onChange={(e) => { setCustomVal(e.target.value); onChange(e.target.value); }}
          placeholder="Type course…"
          className="h-8 w-28 px-2 py-1 text-xs"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

const isRecentlyUpdated = (updatedAtStr?: string) => {
  if (!updatedAtStr) return false;
  const updatedAt = new Date(updatedAtStr);
  const diffMs = new Date().getTime() - updatedAt.getTime();
  return diffMs >= 0 && diffMs < 5 * 60 * 1000; // 5 minutes
};

export const Route = createFileRoute("/_app/students")({
  component: StudentsPage,
});

function StudentsPage() {
  const { user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [examFilter, setExamFilter] = useState<string>("all");
  const [districtFilter, setDistrictFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("id");
  const [page, setPage] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStudent, setShareStudent] = useState<Student | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const pageSize = 8;
  const [lastCalled, setLastCalled] = useState<{ id: string; name: string; mobile: string; time: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("lastCalledStudent");
    if (stored) {
      setLastCalled(JSON.parse(stored));
    }
    const handleStorage = () => {
      const updated = localStorage.getItem("lastCalledStudent");
      if (updated) {
        setLastCalled(JSON.parse(updated));
      } else {
        setLastCalled(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["students", { query, statusFilter, examFilter, districtFilter, courseFilter, sortKey, page }],
    queryFn: () => studentApi.list({ q: query, status: statusFilter, exam: examFilter, district: districtFilter, course: courseFilter, sort: sortKey, page, limit: pageSize }),
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

  const deleteAllMutation = useMutation({
    mutationFn: () => studentApi.deleteAll(),
    onSuccess: () => {
      toast.success("All student leads deleted successfully");
      setDeleteAllOpen(false);
      setConfirmText("");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete all student leads");
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editFatherName, setEditFatherName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editExam, setEditExam] = useState<"JEE Main" | "OJEE" | "Special OJEE" | "Both">("Special OJEE");
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

  // Listen for Ctrl+S / Cmd+S to save inline editing
  useEffect(() => {
    if (!editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        updateMutation.mutate({
          id: editingId,
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    editingId,
    editName,
    editFatherName,
    editMobile,
    editAddress,
    editExam,
    editCourse,
    editVisitDate,
    editStatus,
    editRemarks,
    updateMutation,
  ]);

  const bulkUploadMutation = useMutation({
    mutationFn: (students: any[]) => studentApi.bulkCreate(students),
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.count} leads!`, {
        description: "The pipeline has been updated."
      });
      setPasteOpen(false);
      setPasteText("");
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
    // Strip UTF-8 BOM if present
    let cleanText = text;
    if (cleanText.startsWith("\ufeff")) {
      cleanText = cleanText.slice(1);
    }

    const lines = cleanText.split(/\r?\n/);
    const result = [];
    if (lines.length === 0 || !lines[0].trim()) return [];
    
    // Auto-detect delimiter: tab if tab exists in headers/first row, else comma
    const delimiter = lines[0].includes("\t") ? "\t" : ",";
    
    // Helper to parse a CSV line respecting double quotes
    const parseLine = (line: string) => {
      const row = [];
      let insideQuote = false;
      let entry = "";
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === delimiter && !insideQuote) {
          row.push(entry.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          entry = "";
        } else {
          entry += char;
        }
      }
      row.push(entry.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
      return row;
    };

    const firstLineFields = parseLine(lines[0]);
    
    // Header keywords to check
    const headerKeywords = [
      "name", "student", "fullname", "full name", "student name", "student_name",
      "mobile", "contact", "phone", "number", "mobile number", "phone number",
      "course", "course interest", "course_interest", "branch",
      "address", "district", "city", "permanent address", "location",
      "exam", "entrance exam", "entrance_exam",
      "father name", "father's name", "father_name",
      "status", "remarks", "notes", "counselor", "assigned to"
    ];

    // Detect if first line contains actual data
    const looksLikeData = firstLineFields.some(field => {
      const clean = field.trim().toLowerCase();
      // If it is a phone number (e.g. 10 digits, or starts with + and has digits)
      if (/^\+?[\d\s-]{10,15}$/.test(clean)) return true;
      // If it is a known course
      if (["mca", "mba", "bca", "bba", "b.tech", "b.pharm"].includes(clean)) return true;
      return false;
    });

    const matchesHeaderKeywords = firstLineFields.some(field => {
      const clean = field.trim().toLowerCase();
      return headerKeywords.some(keyword => clean === keyword || clean.includes(keyword));
    });

    const isHeaderless = looksLikeData || !matchesHeaderKeywords;

    let headers: string[] = [];
    let startIndex = 1;

    if (isHeaderless) {
      startIndex = 0; // The first line is data, so don't skip it!
      
      let nameIdx = -1;
      let courseIdx = -1;
      let addressIdx = -1;
      let mobileIdx = -1;
      let examIdx = -1;

      const unassignedIndices = Array.from({ length: firstLineFields.length }, (_, i) => i);

      // 1. Identify Mobile (phone number)
      mobileIdx = firstLineFields.findIndex(f => /^\+?[\d\s-]{8,15}$/.test(f.trim()) && !isNaN(Number(f.replace(/[\s+-]/g, ""))));
      if (mobileIdx !== -1) {
        unassignedIndices.splice(unassignedIndices.indexOf(mobileIdx), 1);
      }

      // 2. Identify Exam (entrance exams)
      examIdx = firstLineFields.findIndex(f => {
        const clean = f.trim().toLowerCase();
        return ["ojee", "jee", "jee main", "special ojee", "spl ojee", "both"].includes(clean) || clean.includes("ojee") || clean.includes("jee");
      });
      if (examIdx !== -1) {
        unassignedIndices.splice(unassignedIndices.indexOf(examIdx), 1);
      }

      // 3. Identify Course
      courseIdx = firstLineFields.findIndex(f => {
        const clean = f.trim().toLowerCase();
        return ["mca", "mba", "bca", "bba", "b.tech", "b.pharm", "m.tech", "cse", "ece", "mechanical", "civil"].includes(clean) ||
               clean.includes("b.tech") || clean.includes("btech") || clean.includes("pharm");
      });
      if (courseIdx !== -1) {
        unassignedIndices.splice(unassignedIndices.indexOf(courseIdx), 1);
      }

      // 4. Identify Name (usually index 0 or the first remaining unassigned column)
      if (unassignedIndices.includes(0)) {
        nameIdx = 0;
        unassignedIndices.splice(unassignedIndices.indexOf(0), 1);
      } else if (unassignedIndices.length > 0) {
        nameIdx = unassignedIndices[0];
        unassignedIndices.splice(0, 1);
      }

      // 5. Identify Address (the next remaining unassigned column)
      if (unassignedIndices.length > 0) {
        addressIdx = unassignedIndices[0];
        unassignedIndices.splice(0, 1);
      }

      headers = firstLineFields.map((_, idx) => {
        if (idx === nameIdx) return "student";
        if (idx === courseIdx) return "course";
        if (idx === addressIdx) return "district";
        if (idx === mobileIdx) return "contact";
        if (idx === examIdx) return "exam";
        return `col_${idx}`;
      });
    } else {
      headers = firstLineFields.map(h => h.toLowerCase().trim());
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const lineText = lines[i].trim();
      if (!lineText) continue;
      
      const row = parseLine(lines[i]);
      
      if (row.length > 0) {
        const obj: any = {};
        headers.forEach((header, index) => {
          if (header) {
            obj[header] = row[index];
          }
        });
        result.push(obj);
      }
    }
    return result;
  };

  const processAndUploadLeads = (text: string) => {
    try {
      const rawRows = parseCSV(text);
      if (rawRows.length === 0) {
        toast.error("No valid data found. Check format.");
        return;
      }
      
      const studentsToUpload = rawRows.map((row) => {
        const getVal = (aliases: string[]) => {
          const rowKeys = Object.keys(row);
          const normalizedAliases = aliases.map(a => a.toLowerCase().trim());
          for (const key of rowKeys) {
            const normalizedKey = key.toLowerCase().trim();
            if (normalizedAliases.includes(normalizedKey)) {
              return row[key];
            }
          }
          return undefined;
        };
        
        const rawExam = getVal(["exam", "entrance exam", "entrance_exam", "exam type", "exam_type"]);
        
        // Helper to detect exam from any text string
        const detectExam = (text: string): string | null => {
          const s = text.trim().toLowerCase();
          if (s === "jee main" || s === "jee") return "JEE Main";
          if (s === "special ojee" || s.includes("special") || s.includes("spl")) return "Special OJEE";
          if (s === "both") return "Both";
          if (s.includes("ojee")) return "OJEE";
          if (s.includes("jee")) return "JEE Main";
          return null;
        };

        let examVal: string | undefined = undefined;

        // 1. Try the dedicated exam column first
        if (rawExam) {
          examVal = detectExam(String(rawExam)) || undefined;
        }

        // 2. If still not found, scan ALL other columns in the row for an exam keyword
        if (!examVal) {
          for (const val of Object.values(row)) {
            if (val && typeof val === "string") {
              const detected = detectExam(val);
              if (detected) {
                examVal = detected;
                break;
              }
            }
          }
        }
        // If still nothing found, leave undefined — backend normalizeExam will decide
        
        return {
          name: getVal(["student", "name", "student name", "student_name", "full name", "fullname"]),
          mobile: getVal(["contact", "mobile", "mobile number", "mobile_number", "phone", "number", "phone number", "phone_number"]),
          fatherName: getVal(["father name", "father's name", "father_name", "fathername"]),
          address: getVal(["district", "address", "city", "permanent address"]),
          exam: examVal,
          course: getVal(["course", "course interest", "course_interest"]),
          status: getVal(["status", "call status", "call_status"]),
          remarks: getVal(["remarks", "notes", "conversation notes", "remarks / conversation notes"]),
          assignedTo: getVal(["assigned to", "assigned_to", "counselor", "assigned counselor"])
        };
      }).filter(s => s.name && s.mobile);
      
      if (studentsToUpload.length === 0) {
        toast.error("No valid leads found. Must contain 'Name' (or 'Student') and 'Mobile' (or 'Contact') columns.");
        return;
      }
      
      bulkUploadMutation.mutate(studentsToUpload as any);
    } catch (err) {
      toast.error("Failed to parse data: " + (err as any).message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      processAndUploadLeads(text);
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
        title="Lead / Consultant"
        description={`${total} leads in your pipeline.`}
        actions={
          <>
            {user?.role === "admin" && (
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print Leads
                </Button>
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
                <Button
                  variant="outline"
                  onClick={() => setPasteOpen(true)}
                  disabled={bulkUploadMutation.isPending}
                >
                  <Clipboard className="mr-2 h-4 w-4" /> Paste & Upload
                </Button>
                <Button variant="destructive" onClick={() => setDeleteAllOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete All Leads
                </Button>
              </>
            )}
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </>
        }
      />

      {lastCalled && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 text-foreground px-4 py-3 rounded-lg text-sm font-medium print:hidden shadow-sm transition-all duration-200">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-muted-foreground">
              Last Called Lead: <strong className="text-foreground">{lastCalled.name}</strong> <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">{lastCalled.mobile}</span> <span className="text-xs">at {lastCalled.time}</span>
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary font-semibold" asChild>
              <a href={`tel:${lastCalled.mobile.replace(/\s+/g, '')}`}>
                <Phone className="h-3.5 w-3.5 mr-1" /> Call Again
              </a>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => {
              localStorage.removeItem("lastCalledStudent");
              setLastCalled(null);
            }}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <Card className="border-border p-4 print:hidden">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto_auto]">
          <div className="relative col-span-full lg:col-span-1">
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
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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
          <Select value={districtFilter} onValueChange={(v) => { setDistrictFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {data?.districts?.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {data?.courses?.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">Sort: Default (ID)</SelectItem>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="status">Sort: Status</SelectItem>
              <SelectItem value="course">Sort: Course</SelectItem>
              <SelectItem value="visit_date">Sort: Visit date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden border-border">
        {!isLoading && !error && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3 text-sm print:hidden">
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
                  <TableHead>Lead/Consultant</TableHead>
                  <TableHead>Father's Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right print:hidden">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const isEditing = s.id === editingId;
                  const recentlyUpdated = isRecentlyUpdated(s.updatedAt);
                  return (
                    <TableRow
                      key={s.id}
                      className={cn(
                        isEditing ? "bg-muted/30 hover:bg-muted/30" : "cursor-pointer",
                        s.isPinned
                          ? "bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-blue-500/5 dark:from-blue-950/40 dark:via-blue-950/20 dark:to-transparent hover:from-blue-500/25 hover:via-blue-500/15 border-l-4 border-l-blue-600 border-b-blue-200/60 dark:border-b-blue-950/60 transition-all duration-300 shadow-sm"
                          : (recentlyUpdated ? "bg-primary/5 border-l-4 border-l-primary hover:bg-primary/10 transition-all duration-300 shadow-sm" : "")
                      )}
                      onClick={() => !isEditing && setActiveId(s.id)}
                    >
                      <TableCell className={cn("transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")}>
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
                            <div className="flex items-center gap-1.5 font-medium text-foreground group flex-wrap">
                              <span>{s.name}</span>
                              {s.isPinned && (
                                <Badge className="bg-blue-600 dark:bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 shadow-sm animate-pulse shrink-0">
                                  On Hold
                                </Badge>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateMutation.mutate({
                                    id: s.id,
                                    data: { isPinned: !s.isPinned }
                                  });
                                }}
                                className={cn(
                                  "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-500",
                                  s.isPinned && "opacity-100 text-blue-500"
                                )}
                                title={s.isPinned ? "Remove On Hold" : "On Hold"}
                              >
                                <Pin className={cn("h-3.5 w-3.5", s.isPinned && "fill-blue-500 text-blue-500")} />
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                              <span>{s.id}</span>
                              {s.updatedAt && (
                                <span className={cn("text-[10px]", recentlyUpdated ? "text-primary font-semibold animate-pulse bg-primary/10 px-1 rounded" : "text-muted-foreground/80")}>
                                  · {recentlyUpdated ? "Updated " : "Modified "}{new Date(s.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </TableCell>
                      <TableCell className={cn("transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")}>
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
                      <TableCell className={cn("whitespace-nowrap transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")} onClick={(e) => e.stopPropagation()}>
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
                      <TableCell className={cn("max-w-[180px] truncate transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")}>
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
                      <TableCell className={cn("transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")} onClick={(e) => e.stopPropagation()}>
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
                      <TableCell className={cn("transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")} onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <InlineCourseField value={editCourse} onChange={setEditCourse} />
                        ) : (
                          s.course
                        )}
                      </TableCell>
                      <TableCell className={cn("whitespace-nowrap transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")}>
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
                      <TableCell className={cn("transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")} onClick={(e) => e.stopPropagation()}>
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
                      <TableCell className={cn("max-w-[220px] truncate text-muted-foreground transition-all duration-300", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")}>
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
                      <TableCell className={cn("text-right transition-all duration-300 print:hidden", recentlyUpdated ? "py-6 text-sm" : "py-3 text-xs")} onClick={(e) => e.stopPropagation()}>
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
                                 asChild
                                 variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                title="Call Student"
                              >
                                <a href={`tel:${s.mobile.replace(/\s+/g, '')}`}>
                                  <Phone className="h-4 w-4" />
                                </a>
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
                                    setStudentToDelete(s);
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

      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead <strong>{studentToDelete?.name}</strong> and remove their data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (studentToDelete) {
                  deleteMutation.mutate(studentToDelete.id);
                  setStudentToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paste & Upload Dialog */}
      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Paste CSV/Excel Data</DialogTitle>
            <DialogDescription>
              Copy columns from Excel or Google Sheets (must contain <strong>Name</strong> (or <strong>Student</strong>) and <strong>Mobile</strong> (or <strong>Contact</strong>)) and paste them below. Tab-separated (TSV) and comma-separated (CSV) formats are both automatically supported.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Name&#9;Mobile&#9;Father's Name&#9;Exam&#10;Ramesh Mohanty&#9;9439012345&#9;Mohan Mohanty&#9;OJEE&#10;Suresh Kumar&#9;9876543210&#9;&#9;JEE Main"
              rows={10}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasteOpen(false)} disabled={bulkUploadMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!pasteText.trim()) {
                  toast.error("Please paste some data first.");
                  return;
                }
                processAndUploadLeads(pasteText);
              }}
              disabled={bulkUploadMutation.isPending}
            >
              {bulkUploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete All Student Leads
            </DialogTitle>
            <DialogDescription>
              Are you absolutely sure you want to delete all student leads? This action is permanent and cannot be undone. All call history and logs associated with students will also be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Please type <strong className="text-destructive font-bold select-none">DELETE ALL</strong> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE ALL"
              className="border-destructive focus-visible:ring-destructive"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteAllOpen(false); setConfirmText(""); }} disabled={deleteAllMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmText !== "DELETE ALL") {
                  toast.error("Confirmation text does not match.");
                  return;
                }
                deleteAllMutation.mutate();
              }}
              disabled={deleteAllMutation.isPending || confirmText !== "DELETE ALL"}
            >
              {deleteAllMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}