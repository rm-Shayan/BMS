import mongoose from "mongoose";

const domainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    description: {
      type: String,
      required: true
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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


// Compound Indexes
domainSchema.index({ bootcampId: 1, name: 1 });
domainSchema.index({ mentorId: 1, bootcampId: 1 });

export const Domain = mongoose.model("Domain", domainSchema);