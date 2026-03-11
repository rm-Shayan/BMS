import express from "express";
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from "../../controllers/assignment.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createAssignmentSchema,
  createAssignmentWithBootcampInBodySchema,
} from "../../validators/assignment.validator.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { MENTOR_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";
import { upload } from "../../middlewares/multer.middleware.js";

const router = express.Router();

// Mentor-only routes
router.use([authMiddleware(), MENTOR_ROLE]);

// Get all assignments (for mentor's bootcamp)
router.get("/", createRateLimiter(100, 1), getAssignments);

// Create an assignment inside a bootcamp (bootcampId in URL)
router.post(
  "/bootcamps/:bootcampId/assignments",
  createRateLimiter(100, 1),
  upload.array("attachments"),
  validate(createAssignmentSchema),
  createAssignment
);

// Create assignment (bootcampId in body) - shorter path for quick flow
router.post(
  "/create-assignment",
  createRateLimiter(100, 1),
  upload.array("attachments"),
  validate(createAssignmentWithBootcampInBodySchema),
  createAssignment
);

// Alias to match "mentor/create assignment" style like requested
router.post(
  "/bootcamps/:bootcampId/create-assignment",
  createRateLimiter(100, 1),
  upload.array("attachments"),
  validate(createAssignmentSchema),
  createAssignment
);

// Get assignments for a bootcamp
router.get(
  "/bootcamps/:bootcampId/assignments",
  createRateLimiter(100, 1),
  getAssignments
);

// Single assignment actions
router.get(
  "/assignments/:assignmentId",
  createRateLimiter(100, 1),
  getAssignmentById
);

router.put(
  "/assignments/:assignmentId",
  createRateLimiter(100, 1),
  updateAssignment
);

router.delete(
  "/assignments/:assignmentId",
  createRateLimiter(100, 1),
  deleteAssignment
);

export default router;
