import { Response } from "express";
import pool from "../config/db";
import { AuthenticatedRequest } from "../middleware/auth";

// Get all students
export const getStudents = async (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string || "").toLowerCase();
  const statusFilter = req.query.status as string || "all";
  const examFilter = req.query.exam as string || "all";
  const districtFilter = req.query.district as string || "all";
  const sortKey = req.query.sort as string || "name";
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    let sql = "SELECT * FROM students WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    // Enforce role-based district/step constraints for staff members
    if (req.user?.role === "staff") {
      const userRes = await pool.query(
        "SELECT assigned_districts, assigned_steps FROM users WHERE id = $1",
        [req.user.id]
      );
      if (userRes.rows.length > 0) {
        const { assigned_districts, assigned_steps } = userRes.rows[0];
        
        if (assigned_districts && assigned_districts.trim() !== "") {
          const dists = assigned_districts.split(",").map(d => d.trim().toLowerCase()).filter(Boolean);
          if (dists.length > 0) {
            sql += ` AND LOWER(TRIM(address)) = ANY($${paramIndex})`;
            params.push(dists);
            paramIndex++;
          }
        }
        
        if (assigned_steps && assigned_steps.trim() !== "") {
          const steps = assigned_steps.split(",").map(s => s.trim()).filter(Boolean);
          if (steps.length > 0) {
            sql += ` AND status = ANY($${paramIndex})`;
            params.push(steps);
            paramIndex++;
          }
        }
      }
    }

    if (query) {
      sql += ` AND (LOWER(name) LIKE $${paramIndex} OR mobile LIKE $${paramIndex} OR LOWER(father_name) LIKE $${paramIndex} OR LOWER(course) LIKE $${paramIndex})`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (statusFilter !== "all") {
      sql += ` AND status = $${paramIndex}`;
      params.push(statusFilter);
      paramIndex++;
    }

    if (examFilter !== "all") {
      sql += ` AND exam = $${paramIndex}`;
      params.push(examFilter);
      paramIndex++;
    }

    if (districtFilter !== "all") {
      sql += ` AND LOWER(TRIM(address)) = $${paramIndex}`;
      params.push(districtFilter.toLowerCase().trim());
      paramIndex++;
    }

    // Sorting
    const validSortKeys = ["name", "status", "course", "visit_date", "id"];
    const actualSortKey = validSortKeys.includes(sortKey) ? sortKey : "name";
    const dbSortKey = actualSortKey === "visitDate" || actualSortKey === "visit_date" ? "visit_date" : actualSortKey;
    sql += ` ORDER BY ${dbSortKey} ASC`;

    // Execute count query
    const countResult = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS counted`, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination if limit > 0
    if (limit > 0) {
      sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
    }

    const result = await pool.query(sql, params);

    const students = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      fatherName: row.father_name,
      mobile: row.mobile,
      address: row.address,
      exam: row.exam,
      course: row.course,
      visitDate: row.visit_date,
      status: row.status,
      remarks: row.remarks,
      assignedTo: row.assigned_to,
    }));

    // Fetch unique districts for filter dropdown (capitalized and trimmed)
    const districtsRes = await pool.query(
      "SELECT DISTINCT INITCAP(TRIM(address)) as district FROM students WHERE address IS NOT NULL AND address != '' ORDER BY district ASC"
    );
    const districts = districtsRes.rows.map(row => row.district);

    res.json({
      students,
      total,
      page,
      totalPages: limit > 0 ? (Math.ceil(total / limit) || 1) : 1,
      districts,
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get single student by ID with call history
export const getStudentById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const studentRes = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    const row = studentRes.rows[0];
    const logsRes = await pool.query("SELECT * FROM call_logs WHERE student_id = $1 ORDER BY date DESC, created_at DESC", [id]);

    const student = {
      id: row.id,
      name: row.name,
      fatherName: row.father_name,
      mobile: row.mobile,
      address: row.address,
      exam: row.exam,
      course: row.course,
      visitDate: row.visit_date,
      status: row.status,
      remarks: row.remarks,
      assignedTo: row.assigned_to,
      history: logsRes.rows.map(log => ({
        id: log.id,
        date: log.date,
        status: log.status,
        remarks: log.remarks,
        by: log.by,
      })),
    };

    res.json(student);
  } catch (error) {
    console.error("Get student by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Normalize exam value to fit database CHECK constraints
const normalizeExam = (exam: string | undefined | null): "JEE Main" | "OJEE" | "Special OJEE" | "Both" => {
  if (!exam) return "JEE Main";
  const str = String(exam).trim().toLowerCase();
  if (str.includes("special") && str.includes("ojee")) return "Special OJEE";
  if (str.includes("jee")) return "JEE Main";
  if (str.includes("ojee")) return "OJEE";
  if (str.includes("both")) return "Both";
  return "JEE Main"; // fallback default
};

// Create a new student lead
export const createStudent = async (req: AuthenticatedRequest, res: Response) => {
  const { name, mobile, fatherName, address, exam, course, status, remarks, assignedTo } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ error: "Name and Mobile number are required" });
  }

  try {
    // Generate next student ID like STU2049
    const maxIdRes = await pool.query("SELECT MAX(CAST(SUBSTRING(id, 4) AS INTEGER)) as max_val FROM students WHERE id LIKE 'STU%'");
    const nextNum = (maxIdRes.rows[0].max_val || 2000) + 1;
    const newId = `STU${nextNum}`;

    const finalAssignedTo = assignedTo || req.user?.name || "Unassigned";
    const finalFatherName = fatherName || "";
    const finalAddress = address || "";
    const finalExam = normalizeExam(exam);
    const finalCourse = course || "B.Tech CSE";
    const finalStatus = status || "Not Called";

    const insertSql = `
      INSERT INTO students (id, name, father_name, mobile, address, exam, course, status, remarks, assigned_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(insertSql, [
      newId, name, finalFatherName, mobile, finalAddress, finalExam, finalCourse, finalStatus, remarks || "", finalAssignedTo
    ]);

    // Log Activity
    const actorName = req.user?.name || finalAssignedTo;
    await pool.query(
      "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
      [actorName, "created lead", name]
    );

    // Update assigned user leads count
    await pool.query(
      "UPDATE users SET assigned_leads = assigned_leads + 1 WHERE name = $1",
      [finalAssignedTo]
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      name: row.name,
      fatherName: row.father_name,
      mobile: row.mobile,
      address: row.address,
      exam: row.exam,
      course: row.course,
      status: row.status,
      remarks: row.remarks,
      assignedTo: row.assigned_to,
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update an existing student
export const updateStudent = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, fatherName, mobile, address, exam, course, status, remarks, assignedTo, visitDate } = req.body;

  try {
    // Check if student exists
    const checkRes = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    const oldStudent = checkRes.rows[0];

    const updateSql = `
      UPDATE students
      SET name = $1, father_name = $2, mobile = $3, address = $4,
          exam = $5, course = $6, status = $7, remarks = $8, assigned_to = $9,
          visit_date = $10
      WHERE id = $11
      RETURNING *
    `;

    const result = await pool.query(updateSql, [
      name || oldStudent.name,
      fatherName || oldStudent.father_name,
      mobile || oldStudent.mobile,
      address || oldStudent.address,
      exam ? normalizeExam(exam) : oldStudent.exam,
      course || oldStudent.course,
      status || oldStudent.status,
      remarks !== undefined ? remarks : oldStudent.remarks,
      assignedTo || oldStudent.assigned_to,
      visitDate !== undefined ? visitDate : oldStudent.visit_date,
      id
    ]);

    // Handle activity logging
    const actorName = req.user?.name || "System";
    if (status && status !== oldStudent.status) {
      await pool.query(
        "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
        [actorName, `updated status of`, name || oldStudent.name]
      );
    } else {
      await pool.query(
        "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
        [actorName, "updated details of", name || oldStudent.name]
      );
    }

    // Handle staff reassignment counts
    if (assignedTo && assignedTo !== oldStudent.assigned_to) {
      await pool.query(
        "UPDATE users SET assigned_leads = assigned_leads - 1 WHERE name = $1",
        [oldStudent.assigned_to]
      );
      await pool.query(
        "UPDATE users SET assigned_leads = assigned_leads + 1 WHERE name = $1",
        [assignedTo]
      );
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      name: row.name,
      fatherName: row.father_name,
      mobile: row.mobile,
      address: row.address,
      exam: row.exam,
      course: row.course,
      visitDate: row.visit_date,
      status: row.status,
      remarks: row.remarks,
      assignedTo: row.assigned_to,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Log a call and update status
export const logCall = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, remarks, course, visitDate, address, fatherName, exam } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Call status is required" });
  }

  try {
    // 1. Fetch current student
    const studentRes = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    const student = studentRes.rows[0];

    // 2. Generate next log ID like LOG2001-3
    const logsCountRes = await pool.query("SELECT COUNT(*) FROM call_logs WHERE student_id = $1", [id]);
    const nextLogIndex = parseInt(logsCountRes.rows[0].count);
    const newLogId = `LOG${id.replace("STU", "")}-${nextLogIndex}`;

    const todayStr = new Date().toISOString().slice(0, 10);
    const callerName = req.user?.name || student.assigned_to;

    // 3. Insert Call Log
    await pool.query(
      "INSERT INTO call_logs (id, student_id, date, status, remarks, by) VALUES ($1, $2, $3, $4, $5, $6)",
      [newLogId, id, todayStr, status, remarks || "No remarks provided.", callerName]
    );

    // 4. Update Student Details (status, remarks, and other fields)
    const updatedStatus = status;
    const updatedRemarks = remarks || student.remarks;
    const updatedCourse = course || student.course;
    const updatedVisitDate = visitDate !== undefined ? visitDate : student.visit_date;
    const updatedAddress = address || student.address;
    const updatedFatherName = fatherName || student.father_name;
    const updatedExam = exam ? normalizeExam(exam) : student.exam;

    await pool.query(
      `UPDATE students 
       SET status = $1, remarks = $2, course = $3, visit_date = $4, address = $5,
           father_name = $6, exam = $7
       WHERE id = $8`,
      [
        updatedStatus, 
        updatedRemarks, 
        updatedCourse, 
        updatedVisitDate, 
        updatedAddress, 
        updatedFatherName, 
        updatedExam, 
        id
      ]
    );

    // 5. Update user calls count
    await pool.query(
      "UPDATE users SET calls_made = calls_made + 1 WHERE name = $1",
      [callerName]
    );

    // 6. Log Activity
    let action = "called";
    if (status === "Visit Scheduled") action = "scheduled visit for";
    if (status === "Admission Confirmed") action = "confirmed admission of";
    
    await pool.query(
      "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
      [callerName, action, student.name]
    );

    // 7. Add Notification if visit scheduled
    if (status === "Visit Scheduled" && visitDate) {
      const notifId = `N_VISIT_${Date.now()}`;
      await pool.query(
        "INSERT INTO notifications (id, type, title, body, time, read) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          notifId,
          "Visit Reminder",
          "Campus visit scheduled",
          `${student.name} is scheduled to visit on ${visitDate}.`,
          "Just now",
          false
        ]
      );
    }

    res.json({ message: "Call logged successfully", status });
  } catch (error) {
    console.error("Log call error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all call logs
export const getCallLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let sql = `
      SELECT cl.id, cl.date, cl.status, cl.remarks, cl.by, s.name as student_name, s.course
      FROM call_logs cl
      JOIN students s ON cl.student_id = s.id
    `;
    const params: any[] = [];
    
    if (req.user?.role === "staff") {
      sql += " WHERE cl.by = $1";
      params.push(req.user.name);
    }
    
    sql += " ORDER BY cl.date DESC, cl.created_at DESC LIMIT 100";
    
    const result = await pool.query(sql, params);
    
    const calls = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      status: row.status,
      remarks: row.remarks,
      by: row.by,
      student: row.student_name,
      course: row.course,
    }));
    
    res.json(calls);
  } catch (error) {
    console.error("Get call logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get Dashboard Statistics and trends
export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let userFilterSql = " WHERE 1=1";
    const filterParams: any[] = [];
    let filterParamIndex = 1;
    let joinFilterSql = "";

    if (req.user?.role === "staff") {
      const userRes = await pool.query(
        "SELECT assigned_districts, assigned_steps FROM users WHERE id = $1",
        [req.user.id]
      );
      if (userRes.rows.length > 0) {
        const { assigned_districts, assigned_steps } = userRes.rows[0];
        
        if (assigned_districts && assigned_districts.trim() !== "") {
          const dists = assigned_districts.split(",").map(d => d.trim().toLowerCase()).filter(Boolean);
          if (dists.length > 0) {
            userFilterSql += ` AND LOWER(TRIM(address)) = ANY($${filterParamIndex})`;
            joinFilterSql += ` AND LOWER(TRIM(s.address)) = ANY($${filterParamIndex})`;
            filterParams.push(dists);
            filterParamIndex++;
          }
        }
        
        if (assigned_steps && assigned_steps.trim() !== "") {
          const steps = assigned_steps.split(",").map(s => s.trim()).filter(Boolean);
          if (steps.length > 0) {
            userFilterSql += ` AND status = ANY($${filterParamIndex})`;
            joinFilterSql += ` AND s.status = ANY($${filterParamIndex})`;
            filterParams.push(steps);
            filterParamIndex++;
          }
        }
      }
    }

    // Total leads count
    const totalLeadsRes = await pool.query("SELECT COUNT(*) FROM students" + userFilterSql, filterParams);
    const totalLeads = parseInt(totalLeadsRes.rows[0].count);

    // Total calls count (sum of all calls_made from users)
    const totalCallsRes = await pool.query("SELECT SUM(calls_made) as count FROM users");
    const totalCalls = parseInt(totalCallsRes.rows[0].count) || 0;

    // Filtered statuses
    const interestedRes = await pool.query("SELECT COUNT(*) FROM students WHERE status IN ('Interested', 'Very Interested')" + userFilterSql.replace("WHERE 1=1", ""), filterParams);
    const interested = parseInt(interestedRes.rows[0].count);

    const visitsScheduledRes = await pool.query("SELECT COUNT(*) FROM students WHERE status = 'Visit Scheduled'" + userFilterSql.replace("WHERE 1=1", ""), filterParams);
    const visitsScheduled = parseInt(visitsScheduledRes.rows[0].count);

    const admissionsRes = await pool.query("SELECT COUNT(*) FROM students WHERE status = 'Admission Confirmed'" + userFilterSql.replace("WHERE 1=1", ""), filterParams);
    const admissions = parseInt(admissionsRes.rows[0].count);

    const staffCountRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'staff'");
    const staffCount = parseInt(staffCountRes.rows[0].count);

    // 1. Lead Sources (Removed)
    const leadSources: any[] = [];

    // 2. Conversion stages (funnel)
    const contactedCountRes = await pool.query("SELECT COUNT(DISTINCT cl.student_id) FROM call_logs cl JOIN students s ON cl.student_id = s.id WHERE 1=1" + joinFilterSql, filterParams);
    const contactedCount = parseInt(contactedCountRes.rows[0].count);

    const visitedCountRes = await pool.query("SELECT COUNT(*) FROM students WHERE visit_date IS NOT NULL AND visit_date != ''" + userFilterSql.replace("WHERE 1=1", ""), filterParams);
    const visitedCount = parseInt(visitedCountRes.rows[0].count);

    const conversion = [
      { stage: "Leads", value: totalLeads },
      { stage: "Contacted", value: contactedCount },
      { stage: "Interested", value: interested },
      { stage: "Visited", value: visitedCount },
      { stage: "Admitted", value: admissions },
    ];

    // 3. Call trends
    const callTrends = {
      daily: [
        { day: "Mon", calls: Math.round(totalCalls * 0.12) },
        { day: "Tue", calls: Math.round(totalCalls * 0.15) },
        { day: "Wed", calls: Math.round(totalCalls * 0.18) },
        { day: "Thu", calls: Math.round(totalCalls * 0.16) },
        { day: "Fri", calls: Math.round(totalCalls * 0.20) },
        { day: "Sat", calls: Math.round(totalCalls * 0.14) },
        { day: "Sun", calls: Math.round(totalCalls * 0.05) },
      ],
      weekly: [
        { week: "W1", calls: Math.round(totalCalls * 0.22) },
        { week: "W2", calls: Math.round(totalCalls * 0.28) },
        { week: "W3", calls: Math.round(totalCalls * 0.26) },
        { week: "W4", calls: Math.round(totalCalls * 0.24) },
      ],
      monthly: [
        { month: "Jan", calls: Math.round(totalCalls * 0.12) },
        { month: "Feb", calls: Math.round(totalCalls * 0.15) },
        { month: "Mar", calls: Math.round(totalCalls * 0.18) },
        { month: "Apr", calls: Math.round(totalCalls * 0.16) },
        { month: "May", calls: Math.round(totalCalls * 0.22) },
        { month: "Jun", calls: Math.round(totalCalls * 0.17) },
      ],
    };

    res.json({
      stats: {
        totalLeads,
        totalCalls,
        interested,
        visitsScheduled,
        admissions,
        staffCount,
      },
      leadSources,
      conversion,
      callTrends,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete student lead
export const deleteStudent = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const checkRes = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    const studentName = checkRes.rows[0].name;

    await pool.query("DELETE FROM students WHERE id = $1", [id]);

    // Log Activity
    const actorName = req.user?.name || "System";
    await pool.query(
      "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
      [actorName, "deleted student lead", studentName]
    );

    res.json({ message: "Student lead deleted successfully" });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete all student leads
export const deleteAllStudents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Delete all students (call_logs will cascade delete because of the ON DELETE CASCADE constraint)
      await client.query("DELETE FROM students");

      // 2. Set assigned leads to 0 for all users since there are no students left
      await client.query("UPDATE users SET assigned_leads = 0");

      // 3. Log Activity
      const actorName = req.user?.name || "System";
      await client.query(
        "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
        [actorName, "deleted all student leads", "All Students"]
      );

      await client.query("COMMIT");
      res.json({ message: "All student leads and call history deleted successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Delete all students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Bulk create students
export const bulkCreateStudents = async (req: AuthenticatedRequest, res: Response) => {
  const { students } = req.body;

  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ error: "Invalid request payload. Expected an array of students." });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const inserted: any[] = [];
      const maxIdRes = await client.query("SELECT MAX(CAST(SUBSTRING(id, 4) AS INTEGER)) as max_val FROM students WHERE id LIKE 'STU%'");
      let currentMaxNum = maxIdRes.rows[0].max_val || 2000;

      const counselorLeadsMap = new Map<string, number>();

      const batchSize = 1000;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const valuePlaceholders: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        for (const s of batch) {
          const { name, mobile, fatherName, address, exam, course, status, remarks, assignedTo } = s;
          if (!name || !mobile) continue;

          currentMaxNum++;
          const newId = `STU${currentMaxNum}`;
          const finalAssignedTo = assignedTo || req.user?.name || "Unassigned";

          valuePlaceholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9})`);
          
          values.push(
            newId,
            name.trim(),
            fatherName || "",
            mobile.trim(),
            address || "",
            normalizeExam(exam),
            course || "B.Tech CSE",
            status || "Not Called",
            remarks || "",
            finalAssignedTo
          );

          paramIndex += 10;

          // Track counselor assignment count
          counselorLeadsMap.set(finalAssignedTo, (counselorLeadsMap.get(finalAssignedTo) || 0) + 1);
        }

        if (values.length > 0) {
          const insertSql = `
            INSERT INTO students (id, name, father_name, mobile, address, exam, course, status, remarks, assigned_to)
            VALUES ${valuePlaceholders.join(", ")}
            RETURNING id, name, father_name as "fatherName", mobile, address, exam, course, status, remarks, assigned_to as "assignedTo"
          `;
          const result = await client.query(insertSql, values);
          inserted.push(...result.rows);
        }
      }

      // Batch update counselor lead counts
      for (const [counselorName, count] of counselorLeadsMap.entries()) {
        await client.query(
          "UPDATE users SET assigned_leads = assigned_leads + $1 WHERE name = $2",
          [count, counselorName]
        );
      }

      // Log Activity
      const actorName = req.user?.name || "Admin";
      await client.query(
        "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
        [actorName, "bulk uploaded leads", `${inserted.length} students`]
      );

      await client.query("COMMIT");
      res.status(201).json({ count: inserted.length, students: inserted });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Bulk create students error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
