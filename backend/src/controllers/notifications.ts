import { Response } from "express";
import pool from "../config/db";
import { AuthenticatedRequest } from "../middleware/auth";

// Get all notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Generate tomorrow's visit reminders dynamically
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const tomorrowVisits = await pool.query(
      "SELECT id, name, visit_date FROM students WHERE visit_date = $1",
      [tomorrowStr]
    );
    for (const student of tomorrowVisits.rows) {
      const checkNotif = await pool.query(
        "SELECT * FROM notifications WHERE type = 'Visit Reminder' AND body LIKE $1",
        [`%${student.name}%scheduled to visit tomorrow%`]
      );
      if (checkNotif.rows.length === 0) {
        const notifId = `N_VISIT_PRE_${student.id}_${Date.now()}`;
        await pool.query(
          "INSERT INTO notifications (id, type, title, body, time, read) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            notifId,
            "Visit Reminder",
            "Campus visit tomorrow",
            `${student.name} is scheduled to visit tomorrow (${student.visit_date}).`,
            "1 day before",
            false
          ]
        );
      }
    }

    const result = await pool.query(
      "SELECT id, type, title, body, time, read FROM notifications ORDER BY read ASC, id DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark notification as read
export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const checkRes = await pool.query("SELECT * FROM notifications WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await pool.query("UPDATE notifications SET read = true WHERE id = $1", [id]);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
