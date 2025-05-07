import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";
import nodemailer from "nodemailer";
import path from "path";

import { fileURLToPath } from "url";
import fs from "fs";
import authenticateToken from "../middleware/authMiddleware.js";
import multer from "multer";
import rateLimit from "express-rate-limit";
import {
  notifyUserRegistration,
  notifyUserRegistrationSMS,
} from "../utils/notify.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "../Uploads/profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Allow 15 requests per window
  handler: (req, res) => {
    console.log(`Rate limit hit for IP: ${req.ip} on /auth/login`);
    res.status(429).json({
      error: "Too many login attempts, please try again later",
      code: "TOO_MANY_REQUESTS",
    });
  },
});

router.post("/signup", async (req, res) => {
  const { email, phone, password, name } = req.body;

  try {
    if (!name || !password) {
      return res.status(400).json({ error: "Name and password are required" });
    }

    if (!email && !phone) {
      return res.status(400).json({ error: "Email or phone is required" });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (phone && !/^\+?\d{10,15}$/.test(phone.replace(/[\s\-\(\)]/g, ""))) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }] : [])],
      },
    });

    if (existingUser) {
      const conflictField = existingUser.email === email ? "email" : "phone";
      return res.status(400).json({
        error: `User with this ${conflictField} already exists`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        name,
        role: "BUYER",
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Send registration email notification
    if (user.email) {
      console.log(
        `ServiceSoko: Attempting registration email notification for user ${user.id}, email: ${user.email}`
      );
      try {
        const notificationResult = await notifyUserRegistration({
          userEmail: user.email,
          userName: user.name,
        });
        console.log(
          `ServiceSoko: Registration email notification for user ${user.id}:`,
          notificationResult
        );
        if (!notificationResult.success) {
          console.error(
            `ServiceSoko: Failed to send registration email notification to ${user.email}:`,
            notificationResult.error
          );
        }
      } catch (notificationError) {
        console.error(
          `ServiceSoko: Error sending registration email notification to ${user.email}:`,
          notificationError.message,
          notificationError.stack
        );
      }
    } else {
      console.log(
        `ServiceSoko: Skipping registration email notification for user ${user.id}: No email provided`
      );
    }

    // Send registration SMS notification
    if (user.phone) {
      console.log(
        `ServiceSoko: Attempting registration SMS notification for user ${user.id}, phone: ${user.phone}`
      );
      try {
        const smsResult = await notifyUserRegistrationSMS({
          userPhone: user.phone,
          userName: user.name,
        });
        console.log(
          `ServiceSoko: Registration SMS notification for user ${user.id}:`,
          smsResult
        );
        if (!smsResult.success) {
          console.error(
            `ServiceSoko: Failed to send registration SMS notification to ${user.phone}:`,
            smsResult.error
          );
        }
      } catch (smsError) {
        console.error(
          `ServiceSoko: Error sending registration SMS notification to ${user.phone}:`,
          smsError.message,
          smsError.stack
        );
      }
    } else {
      console.log(
        `ServiceSoko: Skipping registration SMS notification for user ${user.id}: No phone provided`
      );
    }

    return res.json({
      message: "User registered successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      accessToken: token,
      refreshToken: jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      }),
    });
  } catch (error) {
    console.error("Signup error:", {
      message: error.message,
      stack: error.stack,
    });
    return res.status(500).json({
      error: "An error occurred during registration",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  const { identifier, password, rememberMe } = req.body;
  try {
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ error: "Email/phone and password are required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user) {
      return res.status(400).json({ error: "User not found!" });
    }

    if (!user.password) {
      return res.status(400).json({ error: "This account uses social login" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Wrong password!" });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: rememberMe ? "7d" : "15m" } // Extend expiry if rememberMe
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful!",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Login failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    console.log("REFRESH_SECRET:", process.env.JWT_SECRET);
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true, email: true, phone: true, name: true },
    });

    if (!user) {
      return res.status(403).json({ error: "User not found" });
    }

    const newAccessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error("Refresh error:", {
      message: err.message,
      stack: err.stack,
      token: refreshToken.substring(0, 10) + "...",
    });
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.get("/validate-token", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided", valid: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      return res
        .status(403)
        .json({ error: "User no longer exists", valid: false });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Validate token error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(403).json({
      error: "Invalid or expired token",
      valid: false,
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { identifier } = req.body;

  try {
    if (!identifier) {
      return res.status(400).json({ error: "Email or phone is required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.email) {
      return res.status(400).json({
        error: "Password reset requires email verification",
      });
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"ServiceSoko" <${process.env.BREVO_EMAIL}>`,
      to: user.email,
      subject: "Password Reset Request",
      html: `
          <div style="font-family: Arial, sans-serif;">
            <h2>Password Reset</h2>
            <p>Click below to reset your password:</p>
            <a href="${resetUrl}" 
               style="background: #1976d2; color: white; padding: "10px 15px; text-decoration: none; border-radius: 4px;">
              Reset Password
            </a>
            <p>Link expires in 1 hour.</p>
          </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot password error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to process request",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({
        error: "Token and new password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(404).json({ error: "Invalid token" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", {
      message: error.message,
      stack: error.stack,
    });

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Reset link expired" });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ error: "Invalid token" });
    }

    res.status(500).json({
      error: "Password reset failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
