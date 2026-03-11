import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
    // 1. Check karo ke error "ApiError" ka instance hai ya nahi
    let error = err;

    if (!(error instanceof ApiError)) {
        // Agar simple error hai toh usse ApiError ki format mein convert karo
        const statusCode = error.statusCode || 500;
        const message = error.message || "Something went wrong";
        error = new ApiError(statusCode, message, error?.errors, err.stack);
    }

    // 2. Final Response structure
    const response = {
        success: false,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}), // Stack sirf dev mode mein dikhega
        errors: error.errors || [],
    };

    // 3. Console par error log karna (Devs ke liye)
    console.error(`[${req.method}] ${req.path} >> ${error.message}`);

    return res.status(error.statusCode || 500).json(response);
};