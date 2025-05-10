const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendPasswordResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Password Reset - KindNet",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendVerificationEmail = async (email, verificationUrl) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify Your Email - KindNet",
    html: `
      <h2>Welcome to KindNet!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
