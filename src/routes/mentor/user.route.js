import express from "express";
import {
  getUser,
  refreshToken,
  deleteUser,
  logout,
  updateUser,
} from "../../controllers/user.controller.js";
import { changePassword } from "../../controllers/auth.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { updateUserSchema } from "../../validators/user.validator.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { MENTOR_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

// Refresh token can be used without being logged in; apply rate limiting
router.post("/refresh-token", createRateLimiter(50, 1), refreshToken);

// All mentor routes below require authenticated mentor
router.use([authMiddleware(), MENTOR_ROLE]);

router.get("/me", createRateLimiter(100, 1), getUser);
router.post("/logout", createRateLimiter(100, 1), logout);
router.put(
  "/update",
  createRateLimiter(100, 1),
  upload.single("avatar"),
  validate(updateUserSchema),
  updateUser
);
router.put("/change-password", createRateLimiter(100, 1), changePassword);
router.delete("/delete", createRateLimiter(100, 1), deleteUser);

export default router;
