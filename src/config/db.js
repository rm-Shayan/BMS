import mongoose from "mongoose";
import dotenv from "dotenv";
import { MONGO_URI } from "../constants.js";

dotenv.config({
    path:"../.env"
});

export const connectMongoDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI || MONGO_URI}`,);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // exit app if DB fails
  }
};