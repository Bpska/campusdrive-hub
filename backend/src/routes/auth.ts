import { Router } from "express";
import { login, getMe } from "../controllers/auth";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.get("/me", authenticateToken as any, getMe as any);

export default router;
