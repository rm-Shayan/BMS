
import rateLimit from "express-rate-limit";
import { ApiResponse } from "../utils/ApiResponse.js"; 


export const createRateLimiter = (
  maxRequests = 100,
  windowMinutes = 15,
  message = "Too many requests, please try again later."
) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, 
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      const response = new ApiResponse(429, null, message);
      res.status(429).json(response);
    },
  });
};