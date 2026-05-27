const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const testGmail = async () => {
    console.log("Starting Gmail SMTP test...");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Missing environment variables!");
        return;
    }

    const cleanedPass = process.env.EMAIL_PASS.replace(/\s+/g, "");
    console.log("Cleaned password length:", cleanedPass.length);

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER.trim(),
            pass: cleanedPass,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"FYLFLY Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER.trim(), // Send to self
            subject: "FYLFLY SMTP Connection Test",
            text: "If you are reading this, Gmail SMTP authentication is working perfectly!",
            html: "<h3>Success!</h3><p>Gmail SMTP connection works!</p>",
        });
        console.log("✅ SUCCESS! Email sent successfully.");
        console.log("Message ID:", info.messageId);
    } catch (err) {
        console.error("❌ ERROR! Gmail SMTP failed:", err.message);
        console.error("Error Stack:", err.stack);
    }
};

testGmail();
