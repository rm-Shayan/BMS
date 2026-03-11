import express from "express";
import {
  getDashboardStats,
  getBootcampDashboardStats,
} from "../../controllers/dashboard.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { ADMIN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

router.use([authMiddleware(), ADMIN_ROLE]);

// Global dashboard
router.get("/", createRateLimiter(10, 5), getDashboardStats);

// Bootcamp-level dashboard (used when admin clicks a bootcamp card)
router.get("/:id", createRateLimiter(10, 5), getBootcampDashboardStats);

export default router;
