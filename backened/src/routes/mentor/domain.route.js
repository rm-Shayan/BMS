import express from "express";
import { getDomains } from "../../controllers/domain.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { MENTOR_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

router.use([authMiddleware(), MENTOR_ROLE]);

// List domains for a bootcamp
router.get("/:bootcampId", createRateLimiter(100, 1), getDomains);

export default router;
