import { Response } from "express";
import pool from "../config/db";
import { AuthenticatedRequest } from "../middleware/auth";

// Get all notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
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
