import { Response } from "express";
import pool from "../config/db";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../middleware/auth";

// Get all staff
export const getStaff = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, assigned_leads as "assignedLeads", 
              calls_made as "callsMade", status,
              assigned_districts as "assignedDistricts",
              assigned_steps as "assignedSteps"
       FROM users 
       WHERE role = 'staff' 
       ORDER BY name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new staff member
export const createStaff = async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, assignedDistricts, assignedSteps } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    // Generate next staff ID like STF1006
    const maxIdRes = await pool.query("SELECT MAX(CAST(SUBSTRING(id, 4) AS INTEGER)) as max_val FROM users WHERE id LIKE 'STF%'");
    const nextNum = (maxIdRes.rows[0].max_val || 1000) + 1;
    const newId = `STF${nextNum}`;

    const passwordHash = bcrypt.hashSync(password, 10);

    const insertSql = `
      INSERT INTO users (id, name, email, password, role, status, assigned_leads, calls_made, assigned_districts, assigned_steps)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, name, email, assigned_leads as "assignedLeads", calls_made as "callsMade", status,
                assigned_districts as "assignedDistricts", assigned_steps as "assignedSteps"
    `;

    const result = await pool.query(insertSql, [
      newId, name, email.trim().toLowerCase(), passwordHash, "staff", "Active", 0, 0, assignedDistricts || "", assignedSteps || ""
    ]);

    // Log Activity
    const actorName = req.user?.name || "Admin";
    await pool.query(
      "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
      [actorName, "added staff member", name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update staff status
export const updateStaffStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["Active", "Inactive"].includes(status)) {
    return res.status(400).json({ error: "Valid status ('Active' or 'Inactive') is required" });
  }

  try {
    const checkRes = await pool.query("SELECT * FROM users WHERE id = $1 AND role = 'staff'", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const result = await pool.query(
      `UPDATE users 
       SET status = $1 
       WHERE id = $2 
       RETURNING id, name, email, assigned_leads as "assignedLeads", 
                 calls_made as "callsMade", status`,
      [status, id]
    );

    const staffName = checkRes.rows[0].name;
    const actorName = req.user?.name || "Admin";
    await pool.query(
      "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
      [actorName, `marked status as ${status} for`, staffName]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update staff status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update staff member details
export const updateStaff = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, password, assignedDistricts, assignedSteps } = req.body;

  try {
    const checkRes = await pool.query("SELECT * FROM users WHERE id = $1 AND role = 'staff'", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    const oldStaff = checkRes.rows[0];

    let updateSql = `
      UPDATE users 
      SET name = $1, email = $2, assigned_districts = $3, assigned_steps = $4
    `;
    const params = [
      name || oldStaff.name,
      (email || oldStaff.email).trim().toLowerCase(),
      assignedDistricts !== undefined ? assignedDistricts : oldStaff.assigned_districts,
      assignedSteps !== undefined ? assignedSteps : oldStaff.assigned_steps
    ];

    if (password) {
      const passwordHash = bcrypt.hashSync(password, 10);
      updateSql += `, password = $5 WHERE id = $6`;
      params.push(passwordHash, id);
    } else {
      updateSql += ` WHERE id = $5`;
      params.push(id);
    }

    updateSql += ` RETURNING id, name, email, assigned_leads as "assignedLeads", calls_made as "callsMade", status,
                            assigned_districts as "assignedDistricts", assigned_steps as "assignedSteps"`;

    const result = await pool.query(updateSql, params);

    // Log Activity
    const actorName = req.user?.name || "Admin";
    await pool.query(
      "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
      [actorName, "updated staff member", name || oldStaff.name]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete staff member
export const deleteStaff = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const checkRes = await pool.query("SELECT * FROM users WHERE id = $1 AND role = 'staff'", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    const staffName = checkRes.rows[0].name;

    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    // Log Activity
    const actorName = req.user?.name || "Admin";
    await pool.query(
      "INSERT INTO activities (actor, action, target) VALUES ($1, $2, $3)",
      [actorName, "deleted staff member", staffName]
    );

    res.json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
