export type CallStatus =
  | "Not Called"
  | "Interested"
  | "Very Interested"
  | "Follow Up"
  | "Call Back Later"
  | "Wrong Number"
  | "Busy"
  | "Visit Scheduled"
  | "Admission Confirmed"
  | "Admission Rejected";

export const CALL_STATUSES: CallStatus[] = [
  "Not Called",
  "Interested",
  "Very Interested",
  "Follow Up",
  "Call Back Later",
  "Wrong Number",
  "Busy",
  "Visit Scheduled",
  "Admission Confirmed",
  "Admission Rejected",
];

export const statusColor = (s: CallStatus): string => {
  switch (s) {
    case "Interested":
    case "Very Interested":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Visit Scheduled":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Admission Confirmed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Admission Rejected":
    case "Wrong Number":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "Follow Up":
    case "Call Back Later":
      return "bg-violet-100 text-violet-700 border-violet-200";
    case "Busy":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

export interface CallLog {
  id: string;
  date: string;
  status: CallStatus;
  remarks: string;
  by: string;
}

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  mobile: string;
  address: string;
  exam: "JEE Main" | "OJEE" | "Special OJEE" | "Both";
  course: string;
  visitDate: string | null;
  status: CallStatus;
  remarks: string;
  assignedTo: string;
  history: CallLog[];
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  assignedLeads: number;
  callsMade: number;
  status: "Active" | "Inactive";
  assignedDistricts?: string;
  assignedSteps?: string;
  assignedCourses?: string;
}

export interface Activity {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
}

export interface Notification {
  id: string;
  type: "Visit Reminder" | "New Lead Assigned" | "Follow Up Reminder";
  title: string;
  body: string;
  time: string;
  read: boolean;
  studentId?: string | null;
}

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
const CITIES = [
  "Bhubaneswar, Odisha",
  "Cuttack, Odisha",
  "Rourkela, Odisha",
  "Sambalpur, Odisha",
  "Berhampur, Odisha",
  "Patna, Bihar",
  "Ranchi, Jharkhand",
  "Kolkata, WB",
];
const FIRST = ["Rahul","Priya","Amit","Sneha","Rohit","Anjali","Vikas","Pooja","Arjun","Neha","Karan","Divya","Suresh","Meera","Manish","Kavya","Sandeep","Riya","Ayush","Tanvi","Rohan","Isha","Nitin","Sakshi","Harsh","Pallavi","Deepak","Swati","Aditya","Shreya"];
const LAST = ["Kumar","Sharma","Patel","Singh","Mohanty","Das","Rao","Mishra","Nayak","Sahoo","Mahapatra","Pradhan","Behera","Panda","Jena","Swain","Sethi","Tripathy","Choudhury","Pati"];
const STAFFS = ["Ravi Kapoor","Anita Desai","Vikram Bhatia","Lakshmi Reddy","Mohit Verma"];
const SOURCES = ["Website","Walk-in","Referral","Google Ads","Facebook","Education Fair","Newspaper"];

const seed = (n: number) => {
  let x = Math.sin(n) * 10000;
  return x - Math.floor(x);
};

const pick = <T,>(arr: T[], i: number) => arr[Math.floor(seed(i) * arr.length)];

export const STAFF: Staff[] = STAFFS.map((name, i) => ({
  id: `STF${1001 + i}`,
  name,
  email: name.toLowerCase().replace(" ", ".") + "@crm.com",
  assignedLeads: 18 + Math.floor(seed(i + 1) * 22),
  callsMade: 40 + Math.floor(seed(i + 9) * 80),
  status: i === STAFFS.length - 1 ? "Inactive" : "Active",
}));

const today = new Date();
const dateOffset = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const STUDENTS: Student[] = Array.from({ length: 48 }).map((_, i) => {
  const fn = pick(FIRST, i + 1);
  const ln = pick(LAST, i + 7);
  const status = pick(CALL_STATUSES, i + 3);
  const visit = ["Visit Scheduled", "Admission Confirmed"].includes(status)
    ? dateOffset(Math.floor(seed(i + 5) * 14) - 3)
    : null;
  const staff = pick(STAFF, i + 11).name;
  const course = pick(COURSES, i + 4);
  return {
    id: `STU${2001 + i}`,
    name: `${fn} ${ln}`,
    fatherName: `${pick(FIRST, i + 17)} ${ln}`,
    mobile: `+91 ${70000 + Math.floor(seed(i + 21) * 29999)}${10000 + Math.floor(seed(i + 31) * 89999)}`.replace(/\s\s/, " "),
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`,
    address: pick(CITIES, i + 2),
    exam: (["JEE Main", "OJEE", "Special OJEE", "Both"] as const)[Math.floor(seed(i + 8) * 4)],
    course,
    visitDate: visit,
    status,
    remarks:
      status === "Interested"
        ? "Asked about scholarship options."
        : status === "Visit Scheduled"
        ? "Confirmed campus visit with parents."
        : status === "Admission Confirmed"
        ? "Fee paid. Documents collected."
        : "Will follow up next week.",
    assignedTo: staff,
    source: pick(SOURCES, i + 13),
    history: Array.from({ length: 2 + Math.floor(seed(i + 19) * 3) }).map((_, j) => ({
      id: `LOG${i}-${j}`,
      date: dateOffset(-(j * 3 + 1)),
      status: pick(CALL_STATUSES, i + j + 2),
      remarks: ["Initial contact", "Sent brochure", "Discussed fees", "Parents called back", "Scheduled visit"][j % 5],
      by: staff,
    })),
  };
});

export const ACTIVITIES: Activity[] = Array.from({ length: 20 }).map((_, i) => {
  const staff = pick(STAFF, i + 2).name;
  const stu = STUDENTS[i % STUDENTS.length];
  const actions = [
    { a: "called", t: stu.name },
    { a: "scheduled visit for", t: stu.name },
    { a: "confirmed admission of", t: stu.name },
    { a: "added remarks to", t: stu.name },
    { a: "updated status of", t: stu.name },
  ];
  const act = actions[i % actions.length];
  const h = i;
  const d = new Date(today.getTime() - h * 1000 * 60 * 37);
  return {
    id: `ACT${i}`,
    time: d.toISOString(),
    actor: staff,
    action: act.a,
    target: act.t,
  };
});

export const NOTIFICATIONS: Notification[] = [
  { id: "N1", type: "Visit Reminder", title: "Campus visit at 11:00 AM", body: `${STUDENTS[0].name} is visiting tomorrow.`, time: "10 min ago", read: false },
  { id: "N2", type: "New Lead Assigned", title: "3 new leads assigned", body: "From the latest education fair batch.", time: "1 hour ago", read: false },
  { id: "N3", type: "Follow Up Reminder", title: "Follow up with Priya Das", body: "Last contacted 5 days ago.", time: "3 hours ago", read: false },
  { id: "N4", type: "Visit Reminder", title: "Visit confirmed", body: `${STUDENTS[5].name} confirmed for Friday.`, time: "Yesterday", read: true },
  { id: "N5", type: "New Lead Assigned", title: "Lead from Website", body: "Submitted enquiry form for B.Tech CSE.", time: "Yesterday", read: true },
];

export const CALL_TRENDS = {
  daily: Array.from({ length: 7 }).map((_, i) => ({
    day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    calls: 24 + Math.floor(seed(i + 50) * 30),
  })),
  weekly: Array.from({ length: 8 }).map((_, i) => ({
    week: `W${i + 1}`,
    calls: 120 + Math.floor(seed(i + 70) * 90),
  })),
  monthly: Array.from({ length: 6 }).map((_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i],
    calls: 480 + Math.floor(seed(i + 90) * 320),
  })),
};

export const LEAD_SOURCES = SOURCES.map((s, i) => ({
  source: s,
  value: 30 + Math.floor(seed(i + 100) * 90),
}));

export const CONVERSION = [
  { stage: "Leads", value: 480 },
  { stage: "Contacted", value: 360 },
  { stage: "Interested", value: 210 },
  { stage: "Visited", value: 120 },
  { stage: "Admitted", value: 74 },
];

export const dashboardStats = {
  totalLeads: STUDENTS.length * 10,
  totalCalls: 1284,
  interested: STUDENTS.filter((s) => s.status.includes("Interested")).length * 6,
  visitsScheduled: STUDENTS.filter((s) => s.status === "Visit Scheduled").length * 3,
  admissions: STUDENTS.filter((s) => s.status === "Admission Confirmed").length * 4,
  staffCount: STAFF.length,
};