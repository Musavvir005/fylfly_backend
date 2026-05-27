const nodemailer = require("nodemailer");

/**
 * Robust, self-healing email sender that attempts Gmail first
 * and falls back to Ethereal Email (mock/test SMTP) if Gmail fails or is unconfigured.
 */
const sendMail = async ({ from, to, subject, text, html }) => {
  // 1️⃣ Attempt Gmail first if environment variables exist
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const cleanedPass = process.env.EMAIL_PASS.replace(/\s+/g, "");
      const gmailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER.trim(),
          pass: cleanedPass,
        },
      });

      const info = await gmailTransporter.sendMail({
        from: from || `"FYLFLY" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });

      console.log(`✉  Access code email sent successfully via Gmail to ${to}`);
      return info;
    } catch (err) {
      console.warn(`\n⚠  Gmail SMTP authentication failed (${err.message}).`);
      console.warn(`   Using Ethereal Mail fallback so you can see your sent emails...\n`);
    }
  } else {
    console.log(`\nℹ  No Gmail credentials in .env. Using Ethereal Mail fallback...\n`);
  }

  // 2️⃣ Fallback: Automatically generate a test Ethereal account
  try {
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await etherealTransporter.sendMail({
      from: `"FYLFLY (Test)" <${testAccount.user}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✉  Access code email sent successfully via Ethereal fallback to ${to}`);
    console.log(`🔗  View Ethereal test email here: ${nodemailer.getTestMessageUrl(info)}\n`);
    return info;
  } catch (fallbackErr) {
    console.error("❌ Ethereal mailer fallback failed:", fallbackErr.message);
    throw fallbackErr;
  }
};

module.exports = {
  sendMail
};