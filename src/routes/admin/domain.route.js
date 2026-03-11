import express from "express";
import { createDomain, getDomains, updateDomain, deleteDomain } from "../../controllers/domain.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createDomainForBootcampByIdSchema,
  deleteDomainSchema,
  updateDomainForBootcampSchema,
} from "../../validators/domain.validator.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { ADMIN_ROLE } from "../../middlewares/role-base.middleware.js";
import { createRateLimiter } from "../../middlewares/rate-limiter.middleware.js";

const router = express.Router();

router.use([authMiddleware(), ADMIN_ROLE]);

// Alias route to match requested pattern
router.post(
  "/:id/create-domain",
  createRateLimiter(100, 1),
  validate(createDomainForBootcampByIdSchema),
  createDomain
);

// List domains (optional helper)
router.get(
  "/:bootcampId",
  createRateLimiter(100, 1),
  getDomains
);
router.put(
  "/update/:id",
  createRateLimiter(100, 1),
  validate(updateDomainForBootcampSchema),
  updateDomain
);

router.delete(
  "/delete/:id",
  createRateLimiter(100, 1),
  validate(deleteDomainSchema),
  deleteDomain
);


export default router;
