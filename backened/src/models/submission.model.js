import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
      index: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    submissionLink: {
      type: String,
      required: true
    },

    notes: {
      type: String
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
      index: true
    },

    viewedAt: {
      type: Date
    },

    viewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    feedback: {
      type: String
    },

    score: {
      type: Number,
      min: 0,
      max: 100
    },

    submittedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { timestamps: true }
);


// Important Index
submissionSchema.index(
  { assignmentId: 1, studentId: 1 },
  { unique: true }
);

export const Submission = mongoose.model("Submission", submissionSchema);