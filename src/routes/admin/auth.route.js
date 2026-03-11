import express from "express";
import {
  loginUser,
  forgotPassword,
  resetPassword,
  skipFirstLogin,
  changePassword,
} from "../../controllers/auth.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../../validators/auth.validator.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

const authLimiter = createRateLimiter(5, 1); // 5 requests per 15 minutes

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
  skipFirstLogin
);

router.post(
  "/change-password",
  authMiddleware(),
  authLimiter,
  changePassword
);

export default router;
