import express from "express";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../../controllers/assignment.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import { createAssignmentSchema } from "../../validators/assignment.validator.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { ADMIN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

router.use([authMiddleware(), ADMIN_ROLE]);

// Assignments under a bootcamp (admin can manage assignments)
router.post(
  "/:bootcampId/addd",
  createRateLimiter(100, 1),
  upload.array("attachments"),
  validate(createAssignmentSchema),
  createAssignment
);

router.get(
  "/:bootcampId/",
  createRateLimiter(100, 1),
  getAssignments
);

router.get(
  "/:assignmentId",
  createRateLimiter(100, 1),
  getAssignmentById
);

router.put(
  "/update/:assignmentId",
  createRateLimiter(100, 1),
  updateAssignment
);

router.delete(
  "/delete/:assignmentId",
  createRateLimiter(100, 1),
  deleteAssignment
);

export default router;
