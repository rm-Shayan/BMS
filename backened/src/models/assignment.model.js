import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
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

    domain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
      required: true,
      index: true
    },

    deadline: {
      type: Date,
      required: true,
      index: true
    },

   // Agar attachments ek array hai objects ki, toh aise define karo:
attachments: [
  {
    url: {
      type: String},
      
    publicId: {
      type: String,
    }
  }
],

    bootcampId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bootcamp",
      required: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    }
  },
  { timestamps: true }
);


// Useful compound indexes
assignmentSchema.index({ domain: 1, deadline: 1 });
assignmentSchema.index({ bootcampId: 1, domain: 1 });

export const Assignment = mongoose.model("Assignment", assignmentSchema);