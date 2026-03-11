import express from "express";
import {
  getUser,
  refreshToken,
  deleteUser,
  logout,
  updateUser,
} from "../../controllers/user.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { updateUserSchema } from "../../validators/user.validator.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { INTERN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

// Refresh token can be used without being logged in, but rate-limited
router.post("/refresh-token", createRateLimiter(50, 1), refreshToken);

// All student routes require authentication and student role
router.use([authMiddleware(), INTERN_ROLE]);

router.get("/me", createRateLimiter(100, 1), getUser);
router.post("/logout", createRateLimiter(100, 1), logout);
router.put(
  "/update",
  createRateLimiter(100, 1),
  upload.single("avatar"),
  validate(updateUserSchema),
  updateUser
);
router.delete("/delete", createRateLimiter(100, 1), deleteUser);

export default router;
