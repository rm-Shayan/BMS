import cron from "node-cron";
import { User } from "../../models/user.model.js";
import { sendMail } from "../../services/email.js";

const EMAIL_CRON_SCHEDULE = process.env.EMAIL_CRON_SCHEDULE || "* * * * *";

console.log("[cron:email] initializing with schedule:", EMAIL_CRON_SCHEDULE);

export const sendEmailsToPendingUsers = async () => {
  try {
    const users = await User.find({ isMailSend: false, active: true });

    console.log("[cron:email] found", users.length, "pending users");

    if (!users.length) {
      console.log("[cron:email] no pending users to email");
      return;
    }

    const results = await Promise.all(
      users.map(async (user) => {
        try {
          await sendMail({
            to: user.email,
            subject: "Bootcamp update",
           message: `Hi ${user.name}, your account is ready. 
                      Your temporary password is: Password123! 
                      Please login and change it immediately.`,
          });

          // Use updateOne to avoid schema casting errors on malformed fields (e.g., domain stored as string)
          await User.updateOne({ _id: user._id }, { $set: { isMailSend: true } });

          return { email: user.email, status: "sent" };
        } catch (err) {
          console.error("[cron:email] failed to send to", user.email, err?.message || err);
          return { email: user.email, status: "failed" };
        }
      })
    );
    console.log("[cron:email] job finished", results);
    return results; // Return results for the API response
  } catch (err) {
    console.error("[cron:email] cron job error", err);
    throw err; // Throw for the API handler to catch
  }
};

// Only schedule node-cron if not on Vercel
if (process.env.NODE_ENV !== "production") {
  cron.schedule(
    EMAIL_CRON_SCHEDULE,
    () => {
      console.log("[cron:email] running scheduled job", new Date().toISOString());
      sendEmailsToPendingUsers();
    },
    {
      scheduled: true,
      timezone: process.env.EMAIL_CRON_TZ || "UTC",
    }
  );
}
