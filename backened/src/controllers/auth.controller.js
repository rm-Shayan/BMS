import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Domain } from "../models/domain.model.js";
import mongoose from "mongoose";
import { generateTokens } from "../utils/generate-token.js";
import XLSX from "xlsx";
import fs from "fs";
import { sendMail } from "../services/email.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import { sendEmailsToPendingUsers } from "../utils/cron/emailSend.cron.js";
import otpGenerator from "otp-generator";
import { safeDeleteFile } from "../utils/safeDelete.js";
import { Session } from "../models/session.model.js";
import crypto from "crypto";
import { Bootcamp } from "../models/bootcamp.model.js";
import cache from "../config/cache.js";


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

      for (const row of usersData) {
        const { name, email, password, role, domain, bootcampId } = row;
        if (!email || !password) continue;

        // 1. Domain resolve karein (Check if domain exists)
        let domainId = null;
        if (domain) {
          const foundDomain = await Domain.findOne({ name: domain });
          if (foundDomain) {
            domainId = foundDomain._id;
          } else {
            // Agar domain nhi mila, bhi user create kar sakte hain (optional)
            console.log(`Domain not found for row (${email}), proceeding without domain assignment.`);
          }
        }

        // 2. User Create
        const user = await User.create({
          name,
          email,
          password,
          role: role || "student",
          domain: domainId, // Yahan ab domainId variable pass hoga
          bootcampId,
          isMailSend: true,
        });

        // 3. Bootcamp Update (Mentor/Student logic)
        if (bootcampId) {
          const updateField = role === "mentor" ? "mentors" : "students";
          await Bootcamp.findByIdAndUpdate(bootcampId, {
            $addToSet: { [updateField]: user._id },
          });
        }

        createdUsers.push(user);
      }
    } finally {
      // File deletion safe side pe rakhi hai
      await safeDeleteFile(filePath);
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        createdUsers.map((u) => sanitizeUser(u)),
        `${createdUsers.length} users created from Excel successfully`,
      ),
    );
  }

  // ------------------ CASE 2: Manual Input ------------------
  const { name, email, password, role, domain, bootcampId } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Required fields missing");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  // Domain logic: Sirf tab chale jab 'domain' input mein bheja gaya ho
  let domainId = null;

  if (domain) {
    // Check karein kya yeh valid ID hai
    if (mongoose.Types.ObjectId.isValid(domain)) {
      domainId = domain;
    } else {
      // Agar ID nahi hai, toh naam se search karein
      const foundDomain = await Domain.findOne({ name: domain });
      if (foundDomain) {
        domainId = foundDomain._id;
      } else {
        // Yahan ab Error nahi phenkenge, balki domainId null hi rahega
        console.log("Domain not found, proceeding without domain assignment.");
      }
    }
  }

  // User Create (domainId null ho sakta hai, aur Mongoose isse handle kar lega)
  const user = await User.create({
    name,
    email,
    password,
    role: role || "student",
    domain: domainId, // Yeh null hoga agar domain nahi mila
    bootcampId,
  });

  // If user is mentor and bootcampId is provided, add mentor to bootcamp's mentors list
  if (role === "mentor" && bootcampId) {
    await Bootcamp.findByIdAndUpdate(bootcampId, {
      $addToSet: { mentors: user._id },
    });
  }

  // If user is student and bootcampId is provided, add student to bootcamp's students list
  if (role === "student" && bootcampId) {
    await Bootcamp.findByIdAndUpdate(bootcampId, {
      $addToSet: { students: user._id },
    });
  }

  // Only send email immediately when running in Vercel (production)
  if (process.env.VERCEL) {
    try {
      await sendEmailsToPendingUsers();
    } catch (err) {
      console.error("[createUser] sendEmailsToPendingUsers failed", err?.message || err);
    }
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, sanitizeUser(user), "User created successfully"),
    );
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid credentials");
  }

  // sirf non-admin users ke liye first login check
  if (user.firstLogin && user.role !== "admin") {
    return res.status(403).json(
      new ApiResponse(
        403,
        {
          firstLogin: true,
          userId: user._id,
          email: user.email
        },
        "Must change password on first login. Please use the /change-password-first endpoint or click change password."
      ),
    );
  }

  const { accessToken, refreshToken } = await generateTokens(user);

  const userData = sanitizeUser(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        {
          user: userData,
          accessToken,
        },
        "Login successful",
      ),
    );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  // 1. Generate numeric OTP
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });

  // 2. Hash the OTP for security in cache
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

  cache.set(`reset-${email}`, hashedOTP, 600);

  try {
    await sendMail({
      to: user.email,
      subject: "Your Password Reset OTP",
      message: `Aapka password reset OTP ye hai: ${otp}. Ye 10 minute tak valid hai.`,
    });

    console.log(`OTP for ${email}: ${otp}`); // Development ke liye console pe bhi show kar rahe hain
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
  const incomingHashedOTP = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  if (incomingHashedOTP !== cachedHashedOTP) {
    throw new ApiError(400, "Invalid OTP");
  }

  // 3. Update User Password
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  user.password = password;
  user.firstLogin = false;
  await user.save({ validateModifiedOnly: true });

  // 4. Success: Cleanup cache and kill all sessions for security
  cache.del(`reset-${email}`);
  await Session.deleteMany({ user: user._id });

  res
    .status(200)
    .json(new ApiResponse(200, null, "Password updated successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new ApiError(404, "User not found");
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }
  user.password = newPassword;
  user.firstLogin = false;
  await user.save();
  await Session.updateMany(
    { user: req.user._id },
    { $set: { firstLogin: false } },
  );
  cache.del(`user:${req.user._id}`);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

export const skipFirstLogin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.body.userId || req.user._id);

  if (!user) throw new ApiError(404, "User not found");

  const { accessToken, refreshToken } = await generateTokens(user);

  const userData = sanitizeUser(user);
  user.firstLogin = false;
  await user.save();

  return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .json(
      new ApiResponse(
        200,
        {
          user: userData,
          accessToken,
        },
        "Login skipped",
      ),
    );
});
