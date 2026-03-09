
// Server Port
export const PORT = process.env.PORT || 3000;

// Database Connection
export const MONGO_URI = process.env.MONGO_URI;

export const REDIS_URI=`${process.env.REDIS_URI}`;
// --- JWT Access Token Configuration ---
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
export const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";

// --- JWT Refresh Token Configuration ---
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

// --- JWT Service/Reset Token Configuration ---
export const JWT_SERVICE_SECRET = process.env.JWT_SERVICE_SECRET;
export const JWT_SERVICE_EXPIRY = process.env.JWT_SERVICE_EXPIRY || "10m";

//MAIL SERVICE CONSTANTS

export const MAIL_USER = process.env.MAIL_USER;
export const MAIL_PASS = process.env.MAIL_PASS;
export const MAIL_PORT = process.env.MAIL_PORT;
export const MAIL_HOST = process.env.MAIL_HOST;
// FRONTENED URL

export const FRONTEND_URL=process.env.FRONTEND_URL;

//CLOUDINARY CREDENTIALS
export const CLOUDINARY_CLOUDNAME=process.env.CLOUDINARY_CLOUDNAME;
export const CLOUDINARY_API_KEY=process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET=process.env.CLOUDINARY_API_SECRET;
export const CLOUDINARY_PRESET=process.env.CLOUDINARY_PRESET;