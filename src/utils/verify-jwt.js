
import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError.js";

export const jwtVerify = async (token, secret) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(new ApiError(401, "Invalid or expired token"));
      } else {
        resolve(decoded);
      }
    });
  });
};