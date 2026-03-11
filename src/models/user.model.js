import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import validator from "validator";
import { Schema } from "mongoose";

import { Domain } from "./domain.model.js";

import {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
  JWT_REFRESH_SECRET,
} from "../constants.js";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Use Strong Password");
        }
      },
    },
    role: {
      type: String,
      enum: ["admin", "mentor", "student"],
      default: "student",
    },
    domain: {
      type: Schema.Types.ObjectId,
      ref: "Domain",
    },
    active: {
      type: Boolean,
      default: true,
    },
    dropout: {
      type: Boolean,
      default: false,
    },
    bootcampId: {
      type: Schema.Types.ObjectId, // Direct Schema use kar liya
      ref: "Bootcamp",
    },
    avatar: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    isMailSend: {
      type: Boolean,
      default: false,
    },
    firstLogin: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Normalize domain: allow passing domain name as a string
userSchema.pre("validate", async function (next) {
  if (this.isModified("domain") && typeof this.domain === "string" && !mongoose.Types.ObjectId.isValid(this.domain)) {
    const domainDoc = await Domain.findOne({ name: this.domain.trim() });

    if (!domainDoc) {
      return new Error("Invalid domain: Domain with this name does not exist");
    }

    this.domain = domainDoc._id;
  }
  return
});

// Password Hashing (Pre-save hook)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return
});

// Instance Method: Compare Password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance Method: Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
      bootcampId: this.bootcampId,
      domain: this.domain,
    },
    JWT_ACCESS_SECRET,
    {
      expiresIn: JWT_ACCESS_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
      bootcampId: this.bootcampId,
      domain: this.domain,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRY,
    }
  );
};
// Indexing for performance
userSchema.index({ role: 1, domain: 1 });
userSchema.index({ bootcampId: 1, role: 1 });

export const User = mongoose.model("User", userSchema);