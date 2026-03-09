import mongoose from "mongoose";

const bootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String
    },

    startDate: {
      type: Date,
      required: true,
      index: true
    },

    endDate: {
      type: Date,
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "completed",],
      default: "upcoming",
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    mentors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    domains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Domain"
      }
    ]
  },
  {
    timestamps: true
  }
);


// compound index
bootcampSchema.index({ status: 1, startDate: -1 });

export const Bootcamp = mongoose.model("Bootcamp", bootcampSchema);