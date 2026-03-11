
import nodemailer from "nodemailer";
import { ApiError } from "../utils/ApiError.js";
import { MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_USER } from "../constants.js";

const mailPort = Number(MAIL_PORT);

if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS || !mailPort) {
  console.warn(
    "[email] Missing MAIL_HOST/MAIL_USER/MAIL_PASS/MAIL_PORT. Emails will not work until these env vars are set."
  );
}

export const sendMail = async ({ to, subject, message }) => {
  if (!MAIL_HOST || !MAIL_USER || !MAIL_PASS || !mailPort) {
    throw new ApiError(500, "Email service not configured");
  }

  try {
    // 1️⃣ Transporter
    const transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: mailPort,
      secure: mailPort === 465, // true only for port 465
      auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
      },
    });

    // 2️⃣ Mail options
    const mailOptions = {
      from: `"Bootcamp Support" <${MAIL_USER}>`,
      to,
      subject,
      html: message,
    };

    // 3️⃣ Send mail
    await transporter.sendMail(mailOptions);

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    throw new ApiError(500, "Unable to send email");
  }
};
