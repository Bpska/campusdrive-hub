import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import bcrypt from "bcryptjs";
import { errorHandler } from "./middleware/error";
import authRoutes from "./routes/auth";
import studentsRoutes from "./routes/students";
import staffRoutes from "./routes/staff";
import activitiesRoutes from "./routes/activities";
import notificationsRoutes from "./routes/notifications";
import dashboardRoutes from "./routes/dashboard";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/activities", activitiesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/dashboard", dashboardRoutes);

import pool from "./config/db";

// Global Error Handler
app.use(errorHandler);

// Database initialization & migrations
const runMigrations = async () => {
  try {
    // ── 1. Ensure all core tables exist ──────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
        status VARCHAR(20) DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Inactive')),
        assigned_leads INTEGER DEFAULT 0 NOT NULL,
        calls_made INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        father_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        address VARCHAR(255) NOT NULL,
        exam VARCHAR(50) NOT NULL CHECK (exam IN ('JEE Main', 'OJEE', 'Special OJEE', 'Both')),
        course VARCHAR(100) NOT NULL,
        visit_date VARCHAR(50),
        status VARCHAR(50) NOT NULL,
        remarks TEXT,
        assigned_to VARCHAR(100) NOT NULL,
        is_pinned BOOLEAN DEFAULT false NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id VARCHAR(50) PRIMARY KEY,
        student_id VARCHAR(50) REFERENCES students(id) ON DELETE CASCADE NOT NULL,
        date VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        remarks TEXT NOT NULL,
        by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        actor VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        target VARCHAR(100) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        body TEXT NOT NULL,
        time VARCHAR(50) NOT NULL,
        read BOOLEAN DEFAULT false NOT NULL
      );
    `);

    console.log("All core tables verified / created.");

    // ── 2. Add columns that may be missing on older databases ────────
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_districts TEXT DEFAULT ''");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_steps TEXT DEFAULT ''");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_courses TEXT DEFAULT ''");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) DEFAULT NULL");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

    // ── 3. Seed default admin user if the users table is empty ───────
    const userCount = await pool.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCount.rows[0].count) === 0) {
      const adminHash = bcrypt.hashSync("crm#9753", 10);
      await pool.query(
        "INSERT INTO users (id, email, password, name, role, status, assigned_leads, calls_made) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        ["ADM1001", "admin@crm.com", adminHash, "Padmanava Satapathy", "admin", "Active", 0, 0]
      );
      console.log("Default admin user created (admin@crm.com / crm#9753).");
    }

    // ── 3b. Update admin name for existing databases ─────────────────
    await pool.query("UPDATE users SET name = 'Padmanava Satapathy' WHERE id = 'ADM1001'");
    const updatedAdminHash = bcrypt.hashSync("crm#9753", 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = 'ADM1001'", [updatedAdminHash]);
    // ── 4. Clean up stale seed notifications ─────────────────────────
    await pool.query("DELETE FROM notifications WHERE id IN ('N1', 'N2', 'N3', 'N4', 'N5')");

    // ── 5. Auto-detect and fix past exam types from remarks column ───
    await pool.query(`
      UPDATE students 
      SET exam = 'Special OJEE' 
      WHERE (exam = 'JEE Main' OR exam IS NULL) 
        AND (LOWER(remarks) LIKE '%special ojee%' OR LOWER(remarks) LIKE '%spl ojee%' OR LOWER(remarks) LIKE '%special%')
    `);
    await pool.query(`
      UPDATE students 
      SET exam = 'OJEE' 
      WHERE (exam = 'JEE Main' OR exam IS NULL) 
        AND LOWER(remarks) LIKE '%ojee%' 
        AND LOWER(remarks) NOT LIKE '%special%' 
        AND LOWER(remarks) NOT LIKE '%spl%'
    `);

    console.log("Database migrations applied successfully");
  } catch (err) {
    console.error("Migration error:", err);
  }
};

const startServer = async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
};

startServer();

