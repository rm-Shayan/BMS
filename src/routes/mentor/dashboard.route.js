import express from "express";
import {
  getMentorDashboardStats,
  getMentorStudents,
  getMentorStudentAssignmentStats,
} from "../../controllers/dashboard.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { MENTOR_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

router.use([authMiddleware(), MENTOR_ROLE]);

router.get("/", createRateLimiter(100, 1), getMentorDashboardStats);
router.get("/students", createRateLimiter(100, 1), getMentorStudents);
router.get(
  "/students/:studentId/stats",
  createRateLimiter(100, 1),
  getMentorStudentAssignmentStats
);

export default router;
