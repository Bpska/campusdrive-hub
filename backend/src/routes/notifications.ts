import { Router } from "express";
import { getNotifications, markNotificationRead } from "../controllers/notifications";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.use(authenticateToken as any);

router.get("/", getNotifications as any);
router.put("/:id/read", markNotificationRead as any);

export default router;
