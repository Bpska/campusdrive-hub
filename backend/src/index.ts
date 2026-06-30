import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
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

// Database migrations
const runMigrations = async () => {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_districts TEXT DEFAULT ''");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_steps TEXT DEFAULT ''");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS assigned_courses TEXT DEFAULT ''");
    await pool.query("DELETE FROM notifications WHERE id IN ('N1', 'N2', 'N3', 'N4', 'N5')");
    await pool.query("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) DEFAULT NULL");
    
    // Auto-detect and fix past data exam types from remarks column
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
