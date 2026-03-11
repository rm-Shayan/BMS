import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    refreshToken: { 
      type: String, 
      required: true 
    },
    userAgent: { type: String }, 
    ipAddress: { type: String },
    isValid: { 
      type: Boolean, 
      default: true 
    },
    expiresAt: { 
      type: Date, 
      required: true 
    }
  }, 
  { timestamps: true }
);

// Session Model mein ye index lazmi hona chahiye
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const Session = mongoose.model("Session", sessionSchema);