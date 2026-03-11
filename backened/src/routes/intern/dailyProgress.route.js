import express from "express";
import {
  createDailyProgress,
  getMyDailyProgress,
  updateDailyProgress,
  deleteDailyProgress,
} from "../../controllers/dailyUpdate.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createDailyProgressSchema,
  updateDailyProgressSchema,
} from "../../validators/dailyProgress.validator.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { INTERN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

// Student must be authenticated
router.use([authMiddleware(), INTERN_ROLE]);

router.post(
  "/add",
  createRateLimiter(100, 1),
  validate(createDailyProgressSchema),
  createDailyProgress
);

router.get(
  "/",
  createRateLimiter(100, 1),
  getMyDailyProgress
);

router.put(
  "/update/:id",
  createRateLimiter(100, 1),
  validate(updateDailyProgressSchema),
  updateDailyProgress
);

router.delete(
  "/delete/:id",
  createRateLimiter(100, 1),
  deleteDailyProgress
);

export default router;
