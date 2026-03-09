import mongoose from "mongoose";

const dailyProgressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    date: {
      type: Date,
      required: true,
      index: true
    },

    yesterdayWork: {
      type: String,
      required: true
    },

    todayPlan: {
      type: String,
      required: true
    },

    blockers: {
      type: String
    },

    githubLink: {
      type: String
    },

    hoursWorked: {
      type: Number,
      min: 0,
      max: 24,
      required: true
    }
  },
  { timestamps: true }
);


// Compound Index (1 student = 1 progress per day)
dailyProgressSchema.index({ studentId: 1, date: 1 }, { unique: true });

export const DailyProgress = mongoose.model("DailyProgress", dailyProgressSchema);