import express from "express";
import {
  getUser,
  getUsers,
  deleteUser,
  updateUser,
  logout,
  refreshToken,
  searchUsers,
  updateStatus,
  dropOutStudent,
  blockUser,
} from "../../controllers/user.controller.js";
import { createUser, changePassword } from "../../controllers/auth.controller.js";

import validate from "../../middlewares/validate.middleware.js";
import {
  updateUserSchema,
  searchUsersSchema,
  updateStatusSchema,
  dropOutSchema,
  deleteUserSchema,
} from "../../validators/user.validator.js";
import { createUserSchema } from "../../validators/auth.validator.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { ADMIN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/refresh-token", createRateLimiter(50, 1), refreshToken);

// Attach auth middleware (must be invoked to return the actual handler)
router.use([authMiddleware(), ADMIN_ROLE]);

router.get("/me", createRateLimiter(100, 1), getUser);
router.post("/logout", createRateLimiter(100, 1), logout);

router.get("/all", createRateLimiter(100, 1), getUsers);
router.delete(
  "/delete/:id",
  createRateLimiter(100, 1),
  validate(deleteUserSchema),
  deleteUser
); // Usually delete needs an ID

router.post(
  "/create-student",
  createRateLimiter(100, 1),
  upload.single("file"),
  validate(createUserSchema),
  createUser
);
router.post(
  "/create-mentor",
  createRateLimiter(100, 1),
  upload.single("file"),
  validate(createUserSchema),
  createUser
);

router.put(
  "/update",
  createRateLimiter(100, 1),
  upload.single("avatar"),
  validate(updateUserSchema),
  updateUser
);

router.get(
  "/search",
  createRateLimiter(100, 1),
  validate(searchUsersSchema),
  searchUsers
);
router.put(
  "/status/:id",
  createRateLimiter(100, 1),
  validate(updateStatusSchema),
  updateStatus
);
router.patch(
  "/dropout/:id",
  createRateLimiter(100, 1),
  validate(dropOutSchema),
  dropOutStudent
);

router.patch(
  "/block/:id",
  createRateLimiter(100, 1),
  blockUser
);

router.post("change-password", createRateLimiter(100, 1), changePassword);

export default router;