import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../controllers/announcement.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  createGlobalAnnouncementSchema
} from "../../validators/announcement.validator.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { ADMIN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

router.use([authMiddleware(), ADMIN_ROLE]);

// Global announcements (General)
router.post(
  "/create-global",
  createRateLimiter(100, 1),
  validate(createGlobalAnnouncementSchema),
  createAnnouncement
);

router.get(
  "/global",
  createRateLimiter(100, 1),
  getAnnouncements
);

// Announcements for a specific bootcamp
router.post(
  "/:bootcampId/create",
  createRateLimiter(100, 1),
  validate(createAnnouncementSchema),
  createAnnouncement
);

router.get(
  "/:bootcampId/",
  createRateLimiter(100, 1),
  getAnnouncements
);

router.put(
  "/:bootcampId/update/:id",
  createRateLimiter(100, 1),
  validate(updateAnnouncementSchema),
  updateAnnouncement
);

router.delete(
  "/:bootcampId/delete/:id",
  createRateLimiter(100, 1),
  validate(updateAnnouncementSchema),
  deleteAnnouncement
);

export default router;
