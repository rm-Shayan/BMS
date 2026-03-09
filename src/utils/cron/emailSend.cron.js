import cron from "node-cron";
import { User } from "../../models/user.model.js";
import { sendMail } from "../../services/email.js";

// Schedule: Daily at 09:00 server time (change via EMAIL_CRON_SCHEDULE env var)
const EMAIL_CRON_SCHEDULE = process.env.EMAIL_CRON_SCHEDULE || "0 9 * * *";

// If set, after a successful send the cron will unset the isMailSend flag entirely instead of setting it to false.
const UNSET_IS_MAIL_SEND = process.env.UNSET_IS_MAIL_SEND === "true";

const sendEmailsToPendingUsers = async () => {
  try {
    // Send email only to users who have been flagged to receive one.
    const users = await User.find({ isMailSend: true, active: true }).lean();
    if (!users.length) {
      console.log("[cron:email] no users flagged for email");
      return;
    }

    const results = await Promise.all(
      users.map(async (user) => {
        try {
          await sendMail({
            to: user.email,
            subject: "Bootcamp update",
            message: `Hi ${user.name},<br/><br/>This is a scheduled email from the Bootcamp system.<br/><br/>Best regards,<br/>Bootcamp Team`,
          });

          if (UNSET_IS_MAIL_SEND) {
            await User.findByIdAndUpdate(user._id, { $unset: { isMailSend: "" } });
          } else {
            await User.findByIdAndUpdate(user._id, { isMailSend: false });
          }

          return { email: user.email, status: "sent" };
        } catch (err) {
          console.error("[cron:email] failed to send to", user.email, err);
          return { email: user.email, status: "failed" };
        }
      })
    );

    console.log("[cron:email] job finished", results);
  } catch (err) {
    console.error("[cron:email] cron job error", err);
  }
};

cron.schedule(EMAIL_CRON_SCHEDULE, () => {
  console.log("[cron:email] running scheduled job", new Date().toISOString());
  sendEmailsToPendingUsers();
});
