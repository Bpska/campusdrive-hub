import { Response } from "express";
import pool from "../config/db";
import { AuthenticatedRequest } from "../middleware/auth";

export const getActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT id, time, actor, action, target FROM activities ORDER BY time DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
