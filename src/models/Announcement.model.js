import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      required: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    targetDomain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
      index: true
    },

    bootcampId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);


// useful indexes
announcementSchema.index({ bootcampId: 1, createdAt: -1 });
announcementSchema.index({ targetDomain: 1, createdAt: -1 });

export const Announcement = mongoose.model("Announcement", announcementSchema);