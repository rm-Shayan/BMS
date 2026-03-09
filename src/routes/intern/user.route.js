import express from "express";
import {
  getUser,
  refreshToken,
  deleteUser,
  logout,
} from "../../controllers/user.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { INTERN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

// Refresh token can be used without being logged in, but rate-limited
router.post("/refresh-token", createRateLimiter(5, 15), refreshToken);

// All student routes require authentication and student role
router.use([authMiddleware(), INTERN_ROLE]);

router.get("/me", createRateLimiter(20, 1), getUser);
router.post("/logout", createRateLimiter(5, 15), logout);
router.delete("/delete", createRateLimiter(5, 15), deleteUser);

export default router;
