import { Router } from "express";
import { getStaff, createStaff, updateStaffStatus, updateStaff, deleteStaff } from "../controllers/staff";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticateToken as any);

router.get("/", getStaff as any);
router.post("/", requireAdmin as any, createStaff as any);
router.put("/:id/status", requireAdmin as any, updateStaffStatus as any);
router.put("/:id", requireAdmin as any, updateStaff as any);
router.delete("/:id", requireAdmin as any, deleteStaff as any);

export default router;
