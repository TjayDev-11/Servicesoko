import express from "express";
import nodemailer from "nodemailer";
import "dotenv/config";
import rateLimit from "express-rate-limit";
import DOMPurify from "dompurify";
import { body, validationResult } from "express-validator";

const router = express.Router();

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Connection Ready");
  }
});

// Rate limiting
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 contact requests per window
  message: {
    error: "Too many contact requests",
    code: "RATE_LIMITED",
    message: "Please try again later",
  },
});

// Contact form validation
const validateContactForm = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Invalid email address"),
  body("message").trim().notEmpty().withMessage("Message is required"),
];

router.post(
  "/contact-us",
  contactLimiter,
  validateContactForm,
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg,
        code: "VALIDATION_ERROR",
        details: errors.array(),
      });
    }

    const { name, email, message } = req.body;

    try {
      // Sanitize inputs
      const cleanName = DOMPurify.sanitize(name);
      const cleanEmail = DOMPurify.sanitize(email);
      const cleanMessage = DOMPurify.sanitize(message);

      // Prepare email
      const mailOptions = {
        from: `"ServiceSoko Contact" <${process.env.BREVO_EMAIL}>`,
        to: process.env.CONTACT_RECIPIENT,
        replyTo: cleanEmail,
        subject: `New Contact: ${cleanName}`,
        text: `Name: ${cleanName}\nEmail: ${cleanEmail}\nMessage: ${cleanMessage}`,
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #1976d2;">New Contact Submission</h2>
          <p><strong>Name:</strong> ${cleanName}</p>
          <p><strong>Email:</strong> <a href="mailto:${cleanEmail}">${cleanEmail}</a></p>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${cleanMessage.replace(/\n/g, "<br>")}
          </div>
        </div>
      `,
      };

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log("Contact email sent:", info.messageId);

      res.status(200).json({
        success: true,
        message: "Your message has been sent successfully!",
      });
    } catch (error) {
      console.error("Contact submission failed:", error);

      let errorMessage = "Failed to send your message. Please try again later.";
      let errorCode = "EMAIL_FAILED";

      if (error.code === "EAUTH") {
        errorMessage = "Email authentication failed";
        errorCode = "SMTP_AUTH_ERROR";
      } else if (error.code === "EENVELOPE") {
        errorMessage = "Invalid email address";
        errorCode = "INVALID_EMAIL";
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
        code: errorCode,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

export default router;
