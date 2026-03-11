import express from "express";
import { submitAssignment, getMySubmissions } from "../../controllers/submission.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

router.use(authMiddleware());

router.post("/submit", createRateLimiter(100, 1), submitAssignment);
router.get("/my-submissions", createRateLimiter(100, 1), getMySubmissions);

export default router;
