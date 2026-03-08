const crypto = require("crypto");
const nodemailer = require("nodemailer");
const AppError = require("../../errors/AppError");
const config = require("../../config/config");
const ReviewOtp = require("./reviewOtp.model");

const OTP_LENGTH = 6;
const OTP_EXP_MINUTES = Number(config.otp_expires_minutes || 10);
const MAX_ATTEMPTS = 5;

const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const generateOtp = () => {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
};

const getTransporter = () => {
  if (
    !config.smtp_host ||
    !config.smtp_port ||
    !config.smtp_user ||
    !config.smtp_pass
  ) {
    throw new AppError(500, "SMTP configuration is missing");
  }

  return nodemailer.createTransport({
    host: config.smtp_host,
    port: Number(config.smtp_port),
    secure: Number(config.smtp_port) === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
  });
};

const sendOtpEmail = async (email, otp, purpose) => {
  const transporter = getTransporter();
  const title = purpose === "video-review" ? "Video Review" : "Review";

  await transporter.sendMail({
    from: config.smtp_from || config.smtp_user,
    to: email,
    subject: `Your ${title} Submission OTP`,
    text: `Your OTP code is ${otp}. It will expire in ${OTP_EXP_MINUTES} minutes.`,
    html: `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:40px 0;">
      <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.08);">
        
        <tr>
          <td style="background:#4F46E5;color:#ffffff;padding:20px;text-align:center;">
            <h2 style="margin:0;">OTP Verification</h2>
          </td>
        </tr>

        <tr>
          <td style="padding:30px;text-align:center;">
            <p style="font-size:16px;color:#333;margin-bottom:20px;">
              Use the following OTP to complete your <b>${title}</b> submission.
            </p>

            <div style="font-size:32px;font-weight:bold;letter-spacing:6px;
                        background:#f3f4f6;padding:15px 25px;
                        display:inline-block;border-radius:8px;
                        color:#111;">
              ${otp}
            </div>

            <p style="font-size:14px;color:#555;margin-top:25px;">
              This OTP will expire in <b>${OTP_EXP_MINUTES} minutes</b>.
            </p>

            <p style="font-size:13px;color:#888;margin-top:30px;">
              If you did not request this code, please ignore this email.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#999;">
            © ${new Date().getFullYear()} Your Company. All rights reserved.
          </td>
        </tr>

      </table>
    </div>
    `,
  });
};

const requestOtp = async (email, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

  await ReviewOtp.deleteMany({ email: normalizedEmail, purpose });

  await ReviewOtp.create({
    email: normalizedEmail,
    purpose,
    otpHash,
    expiresAt,
  });

  await sendOtpEmail(normalizedEmail, otp, purpose);

  return {
    email: normalizedEmail,
    expiresAt,
  };
};

const verifyOtp = async (email, otp, purpose) => {
  const normalizedEmail = email.toLowerCase().trim();
  const otpDoc = await ReviewOtp.findOne({
    email: normalizedEmail,
    purpose,
  }).sort({ createdAt: -1 });

  if (!otpDoc) {
    throw new AppError(400, "OTP not found. Please request a new OTP");
  }

  if (otpDoc.expiresAt < new Date()) {
    await ReviewOtp.deleteMany({ email: normalizedEmail, purpose });
    throw new AppError(400, "OTP expired. Please request a new OTP");
  }

  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await ReviewOtp.deleteMany({ email: normalizedEmail, purpose });
    throw new AppError(
      429,
      "Too many invalid OTP attempts. Please request a new OTP",
    );
  }

  const hashed = hashOtp(otp);
  if (hashed !== otpDoc.otpHash) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    throw new AppError(400, "Invalid OTP code");
  }

  await ReviewOtp.deleteMany({ email: normalizedEmail, purpose });
  return true;
};

module.exports = {
  requestOtp,
  verifyOtp,
};
