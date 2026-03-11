import express from "express";
import { getSubmissions, reviewSubmission } from "../../controllers/submission.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { MENTOR_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

router.use([authMiddleware(), MENTOR_ROLE]);

router.get("/all", createRateLimiter(100, 1), getSubmissions);
router.get("/all/:assignmentId", createRateLimiter(100, 1), getSubmissions);
router.patch("/review/:id", createRateLimiter(100, 1), reviewSubmission);

export default router;
