import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import pool from "../config/db";

const CALL_STATUSES = [
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

const today = new Date();
const dateOffset = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

async function main() {
  console.log("Starting database seeding...");

  try {
    // 1. Read and execute schema
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schemaSql);
    console.log("Schema created successfully.");

    // 2. Insert Users (Staff & Admin)
    console.log("Inserting users...");
    const adminPasswordHash = bcrypt.hashSync("admin123", 10);
    const staffPasswordHash = bcrypt.hashSync("staff123", 10);

    // Admin user
    await pool.query(
      "INSERT INTO users (id, email, password, name, role, status, assigned_leads, calls_made) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      ["ADM1001", "admin@crm.com", adminPasswordHash, "Aarav Admin", "admin", "Active", 0, 0]
    );

    // Staff users
    const staffList = STAFFS.map((name, i) => {
      const email = name.toLowerCase().replace(" ", ".") + "@crm.com";
      const assignedLeads = 18 + Math.floor(seed(i + 1) * 22);
      const callsMade = 40 + Math.floor(seed(i + 9) * 80);
      const status = i === STAFFS.length - 1 ? "Inactive" : "Active";
      const id = `STF${1001 + i}`;
      return { id, name, email, assignedLeads, callsMade, status };
    });

    for (const s of staffList) {
      await pool.query(
        "INSERT INTO users (id, email, password, name, role, status, assigned_leads, calls_made) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [s.id, s.email, staffPasswordHash, s.name, "staff", s.status, s.assignedLeads, s.callsMade]
      );
    }
    console.log(`Inserted Admin and ${staffList.length} Staff users.`);

    // 3. Insert Students
    console.log("Inserting students and call logs...");
    const students = Array.from({ length: 4 }).map((_, i) => {
      const fn = pick(FIRST, i + 1);
      const ln = pick(LAST, i + 7);
      const status = pick(CALL_STATUSES, i + 3);
      const visit = ["Visit Scheduled", "Admission Confirmed"].includes(status)
        ? dateOffset(Math.floor(seed(i + 5) * 14) - 3)
        : null;
      const staff = pick(staffList, i + 11).name;
      const course = pick(COURSES, i + 4);
      const remarks =
        status === "Interested"
          ? "Asked about scholarship options."
          : status === "Visit Scheduled"
          ? "Confirmed campus visit with parents."
          : status === "Admission Confirmed"
          ? "Fee paid. Documents collected."
          : "Will follow up next week.";

      return {
        id: `STU${2001 + i}`,
        name: `${fn} ${ln}`,
        fatherName: `${pick(FIRST, i + 17)} ${ln}`,
        mobile: `+91 ${70000 + Math.floor(seed(i + 21) * 29999)}${10000 + Math.floor(seed(i + 31) * 89999)}`.replace(/\s\s/, " "),
        address: pick(CITIES, i + 2),
        exam: pick(["JEE Main", "OJEE", "Special OJEE", "Both"], i + 8),
        course,
        visitDate: visit,
        status,
        remarks,
        assignedTo: staff,
      };
    });

    for (const s of students) {
      await pool.query(
        "INSERT INTO students (id, name, father_name, mobile, address, exam, course, visit_date, status, remarks, assigned_to) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
        [s.id, s.name, s.fatherName, s.mobile, s.address, s.exam, s.course, s.visitDate, s.status, s.remarks, s.assignedTo]
      );

      // Call logs history for this student
      const historyCount = 2 + Math.floor(seed(students.indexOf(s) + 19) * 3);
      for (let j = 0; j < historyCount; j++) {
        const logId = `LOG${s.id.replace("STU", "")}-${j}`;
        const logDate = dateOffset(-(j * 3 + 1));
        const logStatus = pick(CALL_STATUSES, students.indexOf(s) + j + 2);
        const logRemarks = ["Initial contact", "Sent brochure", "Discussed fees", "Parents called back", "Scheduled visit"][j % 5];
        
        await pool.query(
          "INSERT INTO call_logs (id, student_id, date, status, remarks, by) VALUES ($1, $2, $3, $4, $5, $6)",
          [logId, s.id, logDate, logStatus, logRemarks, s.assignedTo]
        );
      }
    }
    console.log(`Inserted ${students.length} students with their call histories.`);

    // 4. Insert Activities
    console.log("Inserting activities...");
    for (let i = 0; i < 4; i++) {
      const staff = pick(staffList, i + 2).name;
      const stu = students[i % students.length];
      const actions = [
        { a: "called", t: stu.name },
        { a: "scheduled visit for", t: stu.name },
        { a: "confirmed admission of", t: stu.name },
        { a: "added remarks to", t: stu.name },
        { a: "updated status of", t: stu.name },
      ];
      const act = actions[i % actions.length];
      const d = new Date(today.getTime() - i * 1000 * 60 * 37);

      await pool.query(
        "INSERT INTO activities (time, actor, action, target) VALUES ($1, $2, $3, $4)",
        [d, staff, act.a, act.t]
      );
    }
    console.log("Inserted 4 activity history items.");

    // 5. Insert Notifications
    console.log("Inserting notifications...");
    const notifications = [
      { id: "N1", type: "Visit Reminder", title: "Campus visit at 11:00 AM", body: `${students[0].name} is visiting tomorrow.`, time: "10 min ago", read: false },
      { id: "N2", type: "New Lead Assigned", title: "3 new leads assigned", body: "From the latest education fair batch.", time: "1 hour ago", read: false },
      { id: "N3", type: "Follow Up Reminder", title: "Follow up with Priya Das", body: "Last contacted 5 days ago.", time: "3 hours ago", read: false },
      { id: "N4", type: "Visit Reminder", title: "Visit confirmed", body: `${students[1].name} confirmed for Friday.`, time: "Yesterday", read: true },
      { id: "N5", type: "New Lead Assigned", title: "Lead from Website", body: "Submitted enquiry form for B.Tech CSE.", time: "Yesterday", read: true },
    ];

    for (const n of notifications) {
      await pool.query(
        "INSERT INTO notifications (id, type, title, body, time, read) VALUES ($1, $2, $3, $4, $5, $6)",
        [n.id, n.type, n.title, n.body, n.time, n.read]
      );
    }
    console.log(`Inserted ${notifications.length} notifications.`);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Database seeding failed:", error);
  } finally {
    await pool.end();
  }
}

main();
