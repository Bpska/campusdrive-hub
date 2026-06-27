import { Router } from "express";
import { getActivities } from "../controllers/activities";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/", authenticateToken as any, getActivities as any);

export default router;
