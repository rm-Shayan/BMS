import express from "express";
import {
  getUser,
  getUsers,
  deleteUser,
  updateUser,
  logout,
  refreshToken,
} from "../../controllers/user.controller.js";
import { createUser } from "../../controllers/auth.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { ADMIN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

router.post("/refresh-token", createRateLimiter(10, 15), refreshToken);

// Attach auth middleware (must be invoked to return the actual handler)
router.use([authMiddleware(), ADMIN_ROLE]);

router.get("/me", createRateLimiter(20, 1), getUser);
router.post("/logout", createRateLimiter(3, 5), logout); 

router.get("/all", createRateLimiter(20, 5), getUsers);
router.delete("/delete/:id", createRateLimiter(3, 5), deleteUser); // Usually delete needs an ID

router.post(
  "/create-student", 
  createRateLimiter(5, 1), 
  upload.single("file"), 
  createUser
);
router.post(
  "/create-Mentor", 
  createRateLimiter(5, 1), 
  upload.single("file"), 
  createUser
);

router.put(
  "/update", 
  createRateLimiter(3, 5), 
  upload.single("avatar"), 
  updateUser
);

export default router;