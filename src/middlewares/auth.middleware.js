import { jwtVerify } from "../utils/verify-jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { JWT_ACCESS_SECRET } from "../constants.js";

export const authMiddleware = (secret = JWT_ACCESS_SECRET) => async (req, res, next) => {
  try {
    let token = null;
    console.log("chla")

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new ApiError(401, "Authorization token missing");
    }

    // Yahan wahi secret use hoga jo pass kiya gaya hai
    const decoded = await jwtVerify(token, secret);
    
    // Request object mein data attach karna
    req.user = decoded;
    req.token = token; // Verify email controller ke liye token zaroori hai

    next();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError(401, "Invalid or expired token"));
  }
};