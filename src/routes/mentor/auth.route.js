import express from "express";
import {
  loginUser,
  forgotPassword,
  resetPassword,
  updateFirstLoginStatus,
} from "../../controllers/auth.controller.js";

import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

const authLimiter = createRateLimiter(5, 15); // 5 requests per 15 minutes

router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/update-first-login", authLimiter, updateFirstLoginStatus);

export default router;
