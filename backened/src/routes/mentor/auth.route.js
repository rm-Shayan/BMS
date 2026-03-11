import express from "express";
import {
  loginUser,
  forgotPassword,
  resetPassword,
  skipFirstLogin,
  changePassword
} from "../../controllers/auth.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../validators/auth.validator.js";

import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

const authLimiter = createRateLimiter(100, 1); // 100 requests per minute

router.post("/login", authLimiter, validate(loginSchema), loginUser);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  resetPassword
);
router.post(
  "/skip-first-login",
  authLimiter,
  skipFirstLogin
);

router.post(
  "/change-password",
  authLimiter,
  authMiddleware(), // Yahan comma lagana zaroori hai
  changePassword    // Controller function
);
export default router;
