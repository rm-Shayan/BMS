import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateTokens } from "../utils/generate-token.js";
import { jwtVerify } from "../utils/verify-jwt.js";
import cache from "../config/cache.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import { JWT_REFRESH_SECRET } from "../constants.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinary.js";

export const getUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "Unauthorized");

    const cachedUser = cache.get(`user:${userId}`);
    if (cachedUser) {
        return res.status(200).json(new ApiResponse(200, cachedUser, "User retrieved from cache"));
    }

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const sanitized = sanitizeUser(user);
    cache.set(`user:${userId}`, sanitized, 3600);

    return res.status(200).json(new ApiResponse(200, sanitized, "User retrieved successfully"));
});

export const refreshToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!incomingRefreshToken) throw new ApiError(401, "Refresh token required");

    // Verify token
    const decoded = await jwtVerify(incomingRefreshToken, JWT_REFRESH_SECRET);

    // DB mein session check karein (User model mein ab refreshToken nahi hai)
    const session = await Session.findOne({
        user: decoded?._id,
        refreshToken: incomingRefreshToken,
        isValid: true
    });

    if (!session) {
        throw new ApiError(401, "Refresh token is invalid or expired");
    }

    const user = await User.findById(decoded?._id);
    if (!user) throw new ApiError(401, "User no longer exists");

    // Generate New Tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);

    // Session update karein (Rotation)
    session.refreshToken = newRefreshToken;
    await session.save();

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, { ...options, maxAge: 15 * 60 * 1000 })
        .cookie("refreshToken", newRefreshToken, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 })
        .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Token refreshed"));
});


export const logout = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const incomingRefreshToken = req.cookies?.refreshToken;

    // Session delete ya invalid karein
    if (incomingRefreshToken) {
        await Session.deleteOne({ refreshToken: incomingRefreshToken });
    }

    cache.del(`user:${userId}`);

    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(200, null, "Logged out successfully"));
});


export const updateUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const updates = { ...req.body };

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (req.file) {
        const uploaded = await uploadToCloudinary(req.file.path, "TodoProfile");
        if (user.avatar?.public_id) {
            await deleteFromCloudinary(user.avatar.public_id);
        }
        updates.avatar = { url: uploaded.url, public_id: uploaded.public_id };
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });
    
    const sanitized = sanitizeUser(updatedUser);
    cache.del(`user:${userId}`);
    cache.set(`user:${userId}`, sanitized, 3600);

    return res.status(200).json(new ApiResponse(200, sanitized, "User updated successfully"));
});


// 1. Controller: Yahan sirf wohi fields mangwayein jo dono roles ke liye common hain
export const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find()
        .populate("bootcampId", "name status startDate endDate")
        // Yahan se 'mentorId' hata diya taake wo fetch hi na ho
        .populate("domain", "name description") 
        .lean(); 

    const sanitizedUsers = users.map(user => sanitizeUser(user));
    
    return res.status(200).json(
        new ApiResponse(200, sanitizedUsers, "Users retrieved successfully")
    );
});

export const deleteUser = asyncHandler(async (req, res) => {
    // Admins can delete any user by id, regular users can only delete their own account
    const requestedId = req.params?.id;
    const userId = req.user?._id;

    const targetUserId = req.user?.role === "admin" && requestedId ? requestedId : userId;

    const userToDelete = await User.findById(targetUserId);
    if (!userToDelete) {
        throw new ApiError(404, "User not found");
    }

    await User.findByIdAndDelete(targetUserId);
    await Session.deleteMany({ user: targetUserId }); // Saari sessions khatam

    cache.del(`user:${targetUserId}`);

    return res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

export const updateStatus = asyncHandler(async (req, res) => {
    const userId = req.params?.id;
    const { status } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    user.status = status;
    await user.save();
    cache.del(`user:${userId}`);
    return res.status(200).json(new ApiResponse(200, null, "User status updated successfully"));
});

export const dropOutStudent = asyncHandler(async (req, res) => {
    const userId = req.params?.id;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    user.isDroppedOut = true;   
    await user.save();
    cache.del(`user:${userId}`);
    return res.status(200).json(new ApiResponse(200, null, "Student marked as dropped out"));
});