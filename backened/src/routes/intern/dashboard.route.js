import express from "express";
import {
  getStudentDashboardStats,
  getStudentBootcampAnnouncements,
  getStudentBootcampAssignments,
  getStudentAssignmentById,
} from "../../controllers/dashboard.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { INTERN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

router.use([authMiddleware(), INTERN_ROLE]);

router.get("/", createRateLimiter(100, 1), getStudentDashboardStats);
router.get(
  "/announcements",
  createRateLimiter(100, 1),
  getStudentBootcampAnnouncements
);
router.get(
  "/assignments",
  createRateLimiter(100, 1),
  getStudentBootcampAssignments
);
router.get(
  "/assignments/:assignmentId",
  createRateLimiter(100, 1),
  getStudentAssignmentById
);

export default router;
