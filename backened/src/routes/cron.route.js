import express from "express";
import { sendEmailsToPendingUsers } from "../utils/cron/emailSend.cron.js";

const router = express.Router();

router.get("/send-emails", async (req, res) => {
  // CRITICAL: Protect the cron endpoint with a secret
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const results = await sendEmailsToPendingUsers();
    return res.status(200).json({
      success: true,
      message: "Cron job executed successfully",
      results,
    });
  } catch (error) {
    console.error("Cron route error:", error);
    return res.status(500).json({
      success: false,
      message: "Cron job failed",
      error: error.message,
    });
  }
});

export default router;
