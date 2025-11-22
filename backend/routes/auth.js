import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import authenticateToken from "../middleware/authMiddleware.js";
import multer from "multer";
import rateLimit from "express-rate-limit";
import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
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
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Rate limiting for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 15, 
  handler: (req, res) => {
    console.log(`Rate limit hit for IP: ${req.ip} on /auth/login`);
    res.status(429).json({
      error: "Too many login attempts, please try again later",
      code: "TOO_MANY_REQUESTS",
    });
  },
});

// Rate limiting for forgot-password
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Allow 5 requests per window
  handler: (req, res) => {
    console.log(`Rate limit hit for IP: ${req.ip} on /auth/forgot-password`);
    res.status(429).json({
      error: "Too many requests, please try again later",
      code: "TOO_MANY_REQUESTS",
    });
  },
});

// Placeholder for SMS service (e.g., Twilio)
const sendSMS = async ({ phone, message }) => {
  console.log(`[SMS Placeholder] Sending to ${phone}: ${message}`);
  try {
    return { success: true };
  } catch (error) {
    console.error("SMS sending error:", error.message, error.stack);
    return { success: false, error: error.message };
  }
};

// Initialize Passport for Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by Google ID or email
        let user = await prisma.user.findFirst({
          where: {
            OR: [
              { googleId: profile.id },
              { email: profile.emails[0].value },
            ],
          },
        });

        if (user) {
          // Update Google ID if not set
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id },
            });
          }
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              role: "BUYER",
            },
          });

          // Send registration notifications
          if (user.email) {
            try {
              const notificationResult = await notifyUserRegistration({
                userEmail: user.email,
                userName: user.name,
              });
              console.log(
                `Registration email notification for user ${user.id}:`,
                notificationResult
              );
            } catch (notificationError) {
              console.error(
                `Error sending registration email to ${user.email}:`,
                notificationError.message
              );
            }
          }
        }

        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error.message);
        return done(error, null);
      }
    }
  )
);

// Serialize user to session (minimal session handling, as we're using JWT)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Initialize Passport middleware
router.use(passport.initialize());

// Google Auth route
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google Auth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=GoogleAuthFailed` }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generate JWT tokens
      const accessToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          name: user.name,
          isSeller: user.isSeller || false,
        },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Redirect to frontend with tokens and user data
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user.id}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email || "")}&role=${user.role}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google callback error:", error.message);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=GoogleAuthFailed`);
    }
  }
);

// Signup route
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

// Login route
router.post("/login", loginLimiter, async (req, res) => {
  const { identifier, password, rememberMe } = req.body;
  console.log("Login attempt for identifier:", identifier);
  try {
    if (!identifier || !password) {
      console.log("Missing identifier or password");
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
      console.log("User not found for identifier:", identifier);
      return res.status(400).json({ error: "User not found!" });
    }

    if (!user.password && !user.googleId) {
      console.log("Account uses social login for user:", user.id);
      return res.status(400).json({ error: "This account uses social login" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log("Incorrect password for user:", user.id);
      return res.status(400).json({ error: "Wrong password!" });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        name: user.name,
        isSeller: user.isSeller || false,
      },
  JWT_SECRET,
      { expiresIn: rememberMe ? "7d" : "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("Login successful for user:", user.id, "Returning tokens");
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

// Refresh token route
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    console.error("No refresh token provided in /auth/refresh");
    return res.status(401).json({
      error: "No refresh token provided",
      code: "MISSING_REFRESH_TOKEN",
    });
  }

  try {
    console.log("Attempting to verify refresh token");
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    if (!payload.id) {
      console.error("Refresh token payload missing id", { payload });
      return res.status(401).json({
        error: "Invalid refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        role: true,
        email: true,
        phone: true,
        name: true,
      },
    });

    if (!user) {
      console.error("User not found for refresh token", { userId: payload.id });
      return res.status(403).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
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

    console.log("Refresh token successful", { userId: user.id });
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", {
      message: error.message,
      stack: error.stack,
      token: refreshToken.substring(0, 10) + "...",
    });
    const response = {
      error: "Invalid or expired refresh token",
      code: "INVALID_REFRESH_TOKEN",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };

    if (error.name === "TokenExpiredError") {
      response.code = "REFRESH_TOKEN_EXPIRED";
      response.message = "Refresh token expired";
    } else if (error.name === "JsonWebTokenError") {
      response.message = "Invalid refresh token";
    }

    return res.status(401).json(response);
  }
});

// Validate token route
router.get("/validate-token", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.error("No token provided in /auth/validate-token");
    return res.status(401).json({
      error: "No token provided",
      code: "MISSING_TOKEN",
      valid: false,
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.id) {
      console.error("Token payload missing id in /auth/validate-token", {
        decoded,
      });
      return res.status(401).json({
        error: "Invalid token",
        code: "INVALID_TOKEN_PAYLOAD",
        valid: false,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        location: true,
        sellerProfile: {
          select: {
            location: true,
            serviceSellers: {
              include: {
                service: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      console.error("User not found in /auth/validate-token", {
        userId: decoded.id,
      });
      return res.status(403).json({
        error: "User no longer exists",
        code: "USER_NOT_FOUND",
        valid: false,
      });
    }

    console.log("Token validation successful", { userId: user.id });
    res.json({
      valid: true,
      user,
    });
  } catch (error) {
    console.error("Validate token error:", {
      message: error.message,
      stack: error.stack,
      token: token.substring(0, 10) + "...",
    });
    const response = {
      error: "Invalid or expired token",
      code: "INVALID_TOKEN",
      valid: false,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };

    if (error.name === "TokenExpiredError") {
      response.code = "TOKEN_EXPIRED";
      response.message = "Token expired";
    } else if (error.name === "JsonWebTokenError") {
      response.message = "Invalid token";
    }

    return res.status(403).json(response);
  }
});

// Forgot password route
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  const { identifier } = req.body;

  try {
    if (!identifier) {
      return res.status(400).json({ error: "Email or phone is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/;
    const isEmail = emailRegex.test(identifier);
    const isPhone = phoneRegex.test(identifier.replace(/[\s\-\(\)]/g, ""));

    if (!isEmail && !isPhone) {
      return res.status(400).json({ error: "Invalid email or phone format" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: isEmail ? identifier : undefined },
          { phone: isPhone ? identifier : undefined },
        ],
      },
    });

    // Always return success to prevent enumeration
    if (!user) {
      console.log(`No user found for identifier: ${identifier}`);
      return res.json({
        message: "If an account exists, a reset link has been sent",
      });
    }

    const resetToken = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    if (isEmail && user.email) {
      const mailOptions = {
        from: `"ServiceSoko" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937;">Password Reset</h2>
            <p style="color: #4b5563;">You requested a password reset for your ServiceSoko account.</p>
            <p style="color: #4b5563;">Click the button below to set a new password:</p>
            <a href="${resetUrl}" 
               style="display: inline-block; background: #22d3ee; color: #1f2937; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #4b5563;">This link will expire in 1 hour.</p>
            <p style="color: #4b5563;">If you didn't request this, please ignore this email.</p>
            <p style="color: #4b5563;">Best regards,<br>The ServiceSoko Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${user.email}`);
    }

    if (isPhone && user.phone) {
      const smsMessage = `ServiceSoko: Reset your password here: ${resetUrl} (Expires in 1 hour)`;
      const smsResult = await sendSMS({
        phone: user.phone,
        message: smsMessage,
      });
      if (!smsResult.success) {
        console.error(`Failed to send SMS to ${user.phone}: ${smsResult.error}`);
      } else {
        console.log(`Password reset SMS sent to ${user.phone}`);
      }
    }

    res.json({ message: "If an account exists, a reset link has been sent" });
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

// Reset password route
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
        code: "INVALID_PASSWORD",
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one uppercase letter",
        code: "INVALID_PASSWORD",
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one lowercase letter",
        code: "INVALID_PASSWORD",
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        error: "Password must contain at least one number",
        code: "INVALID_PASSWORD",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid token" });
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

// Change password route
router.post("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Current and new passwords are required",
        code: "MISSING_FIELDS",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters",
        code: "INVALID_PASSWORD",
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        error: " PPPassword must contain at least one uppercase letter",
        code: "INVALID_PASSWORD",
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        error: "New password must contain at least one lowercase letter",
        code: "INVALID_PASSWORD",
      });
    }

    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        error: "New password must contain at least one number",
        code: "INVALID_PASSWORD",
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Verify current password
    if (!user.password) {
      return res.status(400).json({
        error: "This account uses social login",
        code: "SOCIAL_LOGIN",
      });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        error: "Incorrect current password",
        code: "INVALID_CURRENT_PASSWORD",
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to change password",
      code: "SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete user route
router.delete("/users", authenticateToken, async (req, res) => {
  try {
    const { reason, otherReason } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!reason) {
      return res.status(400).json({
        error: "Reason for deletion is required",
        code: "MISSING_REASON",
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    // Log deletion reason
    await prisma.deletedUserLog.create({
      data: {
        userId,
        reason,
        otherReason: otherReason || null,
        deletedAt: new Date(),
      },
    });

    // Delete the user
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to delete account",
      code: "SERVER_ERROR",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;