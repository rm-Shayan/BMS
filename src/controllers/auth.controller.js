import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { generateTokens } from "../utils/generate-token.js";
import XLSX from "xlsx";
import fs from "fs";
import {sendMail} from "../services/email.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import otpGenerator  from "otp-generator"
import { safeDeleteFile } from "../utils/safeDelete.js";
import { Session } from "../models/session.model.js";
import crypto from "crypto"
import cache  from "../config/cache.js";


export const createUser = asyncHandler(async (req, res) => {
  let createdUsers = [];

  // ------------------ CASE 1: Excel File Upload ------------------
  if (req.file) {
    const filePath = req.file.path;

    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, "Excel file not found");
    }

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const usersData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // Bulk DB Operation: Performance ke liye aap insertMany bhi use kar sakte hain
      for (const row of usersData) {
        const { name, email, password, role, domain, bootcampId } = row;

        if (!email || !password) continue;

        const existingUser = await User.findOne({ email });
        if (existingUser) continue;

        const user = await User.create({
          name,
          email,
          password,
          role: role || "student",
          domain,
          bootcampId,
        });

        createdUsers.push(user);
      }
    } finally {
      // File deletion safe side pe rakhi hai
    await  safeDeleteFile(filePath);
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        createdUsers.map(u => sanitizeUser(u)),
        `${createdUsers.length} users created from Excel successfully`
      )
    );
  }

  // ------------------ CASE 2: Manual Input ------------------
  const { name, email, password, role, domain, bootcampId } = req.body;

  if (!name || !email || !password || !domain) {
    throw new ApiError(400, "Required fields missing");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "student",
    domain,
    bootcampId,
  });

  return res.status(201).json(
    new ApiResponse(201, sanitizeUser(user), "User created successfully")
  );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Password check ke liye select use kiya hai
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateTokens(user);
    
    await Session.deleteMany({ 
    user: user._id, 
    userAgent: req.get("User-Agent") // Same browser/device ki purani sessions khatam
});

    // Session Create karein (Ab refresh token yahan save hoga)
    const session = await Session.create({
        user: user._id,
        refreshToken,
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
    });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    const userData = sanitizeUser(user);

    res.status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { 
            user: userData, 
            accessToken,
            firstLogin: session.firstLogin // UI ko yahan se pata chalega ke password change karwana hai
        }, "Login successful"));
});

export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    // 1. Generate numeric OTP
    const otp = otpGenerator.generate(6, { 
        upperCaseAlphabets: false, 
        specialChars: false, 
        lowerCaseAlphabets: false 
    });

    // 2. Hash the OTP for security in cache
    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    /**
     * 3. Store in Cache instead of DB
     * Key: password-reset:email
     * TTL: 600 seconds (10 minutes)
     */
    cache.set(`reset-${email}`, hashedOTP, 600);

    try {
        await sendMail({
            email: user.email,
            subject: "Your Password Reset OTP",
            message: `Aapka password reset OTP ye hai: ${otp}. Ye 10 minute tak valid hai.`,
        });
        
        res.status(200).json(new ApiResponse(200, null, "OTP sent to email"));
    } catch (error) {
        // Agar email fail ho jaye toh cache se foran delete kar dein
        cache.del(`reset-${email}`);
        throw new ApiError(500, "Email failed to send");
    }
});

export const resetPassword = asyncHandler(async (req, res) => {
    const { otp, password, email } = req.body; 

    if (!otp || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    // 1. Get hashed OTP from cache
    const cachedHashedOTP = cache.get(`reset-${email}`);

    if (!cachedHashedOTP) {
        throw new ApiError(400, "OTP expired or invalid request");
    }

    // 2. Verify OTP
    const incomingHashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    if (incomingHashedOTP !== cachedHashedOTP) {
        throw new ApiError(400, "Invalid OTP");
    }

    // 3. Update User Password
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    user.password = password;
    await user.save();

    // 4. Success: Cleanup cache and kill all sessions for security
    cache.del(`reset-${email}`);
    await Session.deleteMany({ user: user._id });

    res.status(200).json(new ApiResponse(200, null, "Password updated successfully"));
});


export const updateFirstLoginStatus = asyncHandler(async (req, res) => {
    const { newPassword, skip } = req.body;
    
    // Auth middleware se req.user._id mil jayega
    const session = await Session.findOne({ user: req.user._id, isValid: true }).sort({ createdAt: -1 });

    if (!session) throw new ApiError(404, "Active session not found");

    if (!skip && newPassword) {
        const user = await User.findById(req.user._id);
        user.password = newPassword;
        await user.save();
    }
    
    // Flag update in session model
    session.firstLogin = false;
    await session.save();

    res.status(200).json(new ApiResponse(200, null, "First login status updated"));
});