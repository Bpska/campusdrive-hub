import { Router } from "express";
import { getStudents, getStudentById, createStudent, updateStudent, logCall, getCallLogs, deleteStudent, bulkCreateStudents, deleteAllStudents, getStudentsMeta } from "../controllers/students";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticateToken as any);

router.get("/", getStudents as any);
router.get("/meta", getStudentsMeta as any);
router.get("/calls/logs", getCallLogs as any);
router.post("/bulk", bulkCreateStudents as any);
router.get("/:id", getStudentById as any);
router.post("/", createStudent as any);
router.put("/:id", updateStudent as any);
router.post("/:id/calls", logCall as any);
router.delete("/", requireAdmin as any, deleteAllStudents as any);
router.delete("/:id", requireAdmin as any, deleteStudent as any);

export default router;
