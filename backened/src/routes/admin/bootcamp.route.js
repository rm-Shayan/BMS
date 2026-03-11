import express from "express";
import {
  createBootcamp,
  getBootcampById,
  getBootcamps,
  updateBootcamp,
  deleteBootcamp,
  extendBootcamp,
} from "../../controllers/bootcamp.controller.js";
import { createDomain, getDomains, updateDomain, deleteDomain } from "../../controllers/domain.controller.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  createBootcampSchema,
  updateBootcampSchema,
  bootcampIdSchema,

} from "../../validators/bootcamp.validator.js";
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

// Bootcamp CRUD (v2)
router.post(
  "/bootcamp/create",
  createRateLimiter(100, 1),
  validate(createBootcampSchema),
  createBootcamp
);

router.get(
  "/bootcamp",
  createRateLimiter(100, 1),
  getBootcamps
);

router.get(
  "/bootcamp/:id",
  createRateLimiter(100, 1),
  validate(bootcampIdSchema),
  getBootcampById
);

router.put(
  "/bootcamp/:id/update",
  createRateLimiter(100, 1),
  validate(updateBootcampSchema),
  updateBootcamp
);

router.delete(
  "/bootcamp/:id/delete",
  createRateLimiter(100, 1),
  validate(bootcampIdSchema),
  deleteBootcamp
);

router.patch(
  "/bootcamp/:id/extend",
  createRateLimiter(100, 1),
  extendBootcamp
);

// Alias route to match requested pattern
router.post(
  "/bootcamp/:id/create-domain",
  createRateLimiter(100, 1),
  validate(createDomainForBootcampByIdSchema),
  createDomain
);

// List domains (optional helper)
router.get(
  "/bootcamp/:bootcampId/domains",
  createRateLimiter(100, 1),
  getDomains
);
router.put(
  "/bootcamp/domain/update/:id",
  createRateLimiter(100, 1),
  validate(updateDomainForBootcampSchema),
  updateDomain
);

router.delete(
  "/bootcamp/domain/delete/:id",
  createRateLimiter(100, 1),
  validate(deleteDomainSchema),
  deleteDomain
);


export default router;
