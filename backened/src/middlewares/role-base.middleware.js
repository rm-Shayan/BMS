import { ApiError } from "../utils/ApiError.js";

export const INTERN_ROLE = (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Unauthorized request"));

  // Correct comparison
  if (req.user.role !== "student") {
    return next(new ApiError(403, "Access denied"));
  }

  next();
};



export const MENTOR_ROLE = (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Unauthorized request"));
  if (req.user.role !== "mentor") {
    return next(new ApiError(403, "Only Mentors can access this route"));
  }
  next();
};

export const ADMIN_ROLE = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(
      new ApiError(403, "Only Admin can access this route")
    );''
  }
  next();
};