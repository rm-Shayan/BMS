
import nodemailer from "nodemailer";
import { ApiError } from "../utils/ApiError.js";
import { MAIL_HOST,MAIL_PASS,MAIL_PORT,MAIL_USER } from "../constants.js";

export const sendMail = async ({ to, subject, message }) => {
  try {
    // 1️⃣ Transporter
    const transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: false, // true only for port 465
      auth: {
        user:MAIL_USER,
        pass:MAIL_PASS,
      },
    });

    // 2️⃣ Mail options
    const mailOptions = {
      from: `"Bootcamp Support" <${process.env.MAIL_USER}>`,
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
