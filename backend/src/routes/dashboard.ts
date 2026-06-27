import { Router } from "express";
import { getDashboardStats } from "../controllers/students";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/stats", authenticateToken as any, getDashboardStats as any);

export default router;
