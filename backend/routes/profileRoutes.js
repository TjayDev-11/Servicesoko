import express from "express";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import rateLimit from "express-rate-limit";
import {
  notifySellerApproval,
  notifySellerApprovalSMS,
} from "../utils/notify.js";

const { window } = new JSDOM("");
const DOMPurify = createDOMPurify(window);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET;

// Configure upload directory
const uploadDir = path.join(__dirname, "../Uploads/profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting
const profileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 requests per window
});

// Get user profile
router.get("/profile", authenticateToken, profileLimiter, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Invalid user ID",
        code: "INVALID_USER_ID",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        name: true,
        sellerProfile: {
          select: {
            location: true,
            gender: true,
            profilePhoto: true,
            services: true,
            experience: true,
            isComplete: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      user: {
        ...user,
        profileComplete: !!user.sellerProfile?.isComplete,
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    res.status(500).json({
      error: "Failed to fetch profile",
      code: "PROFILE_FETCH_FAILED",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update profile
router.put("/profile", authenticateToken, profileLimiter, async (req, res) => {
  try {
    const { name, email, phone, location, services, experience } = req.body;

    // Input validation
    if (!name?.trim()) {
      return res.status(400).json({
        error: "Name is required",
        code: "MISSING_NAME",
      });
    }

    const cleanData = {
      name: DOMPurify.sanitize(name.trim()),
      email: email ? DOMPurify.sanitize(email.trim()) : null,
      phone: phone ? DOMPurify.sanitize(phone.trim()) : null,
    };

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: req.user.id },
        data: cleanData,
        select: { id: true, name: true, email: true, phone: true, role: true },
      });

      if (["seller", "both"].includes(req.user.role)) {
        await tx.sellerProfile.upsert({
          where: { userId: req.user.id },
          update: {
            location: DOMPurify.sanitize(location?.trim() || ""),
            services: Array.isArray(services) ? services : [],
            experience: parseInt(experience) || 0,
            isComplete: true,
          },
          create: {
            userId: req.user.id,
            name: cleanData.name,
            phone: cleanData.phone,
            location: DOMPurify.sanitize(location?.trim() || ""),
            services: Array.isArray(services) ? services : [],
            experience: parseInt(experience) || 0,
            isComplete: true,
          },
        });
      }

      return user;
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);

    if (error.code === "P2002") {
      return res.status(400).json({
        error: "Email or phone already in use",
        code: "DUPLICATE_ENTRY",
      });
    }

    res.status(500).json({
      error: "Profile update failed",
      code: "PROFILE_UPDATE_FAILED",
    });
  }
});

// Become a seller
router.post(
  "/become-seller",
  authenticateToken,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const { name, phone, location, gender } = req.body;
      if (!name?.trim() || !location?.trim()) {
        return res.status(400).json({
          error: "Name and location are required",
          code: "MISSING_FIELDS",
        });
      }
      const validGenders = ["Male", "Female", "Other", "Prefer not to say"];
      const cleanGender = validGenders.includes(gender) ? gender : null;
      const cleanName = DOMPurify.sanitize(name.trim());
      const cleanPhone = phone ? DOMPurify.sanitize(phone.trim()) : null;
      const cleanLocation = DOMPurify.sanitize(location.trim());

      const result = await prisma.$transaction(async (tx) => {
        const existingProfile = await tx.sellerProfile.findUnique({
          where: { userId: req.user.id },
        });
        if (existingProfile) {
          throw new Error("You are already a seller");
        }
        let photoUrl = null;
        if (req.file) {
          photoUrl = `/Uploads/profiles/${req.file.filename}`;
        }
        const sellerProfile = await tx.sellerProfile.create({
          data: {
            userId: req.user.id,
            name: cleanName,
            phone: cleanPhone,
            location: cleanLocation,
            gender: cleanGender,
            profilePhoto: photoUrl,
            services: [],
            isComplete: true,
          },
        });
        const updatedUser = await tx.user.update({
          where: { id: req.user.id },
          data: { role: "BOTH" },
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            name: true,
          },
        });
        return { sellerProfile, photoUrl, updatedUser };
      });

      // Send seller approval email notification
      if (result.updatedUser.email) {
        console.log(
          `ServiceSoko: Attempting seller approval email notification for user ${req.user.id}, email: ${result.updatedUser.email}`
        );
        try {
          const notificationResult = await notifySellerApproval({
            userEmail: result.updatedUser.email,
            userName: result.updatedUser.name,
          });
          console.log(
            `ServiceSoko: Seller approval email notification for user ${req.user.id}:`,
            notificationResult
          );
          if (!notificationResult.success) {
            console.error(
              `ServiceSoko: Failed to send seller approval email notification to ${result.updatedUser.email}:`,
              notificationResult.error
            );
          }
        } catch (notificationError) {
          console.error(
            `ServiceSoko: Error sending seller approval email notification to ${result.updatedUser.email}:`,
            notificationError.message,
            notificationError.stack
          );
        }
      } else {
        console.log(
          `ServiceSoko: Skipping seller approval email notification for user ${req.user.id}: No email provided`
        );
      }

      // Send seller approval SMS notification
      if (result.updatedUser.phone) {
        console.log(
          `ServiceSoko: Attempting seller approval SMS notification for user ${req.user.id}, phone: ${result.updatedUser.phone}`
        );
        try {
          const smsResult = await notifySellerApprovalSMS({
            userPhone: result.updatedUser.phone,
            userName: result.updatedUser.name,
          });
          console.log(
            `ServiceSoko: Seller approval SMS notification for user ${req.user.id}:`,
            smsResult
          );
          if (!smsResult.success) {
            console.error(
              `ServiceSoko: Failed to send seller approval SMS notification to ${result.updatedUser.phone}:`,
              smsResult.error
            );
          }
        } catch (smsError) {
          console.error(
            `ServiceSoko: Error sending seller approval SMS notification to ${result.updatedUser.phone}:`,
            smsError.message,
            smsError.stack
          );
        }
      } else {
        console.log(
          `ServiceSoko: Skipping seller approval SMS notification for user ${req.user.id}: No phone provided`
        );
      }

      const newToken = jwt.sign(
        {
          id: result.updatedUser.id,
          email: result.updatedUser.email,
          phone: result.updatedUser.phone,
          role: result.updatedUser.role,
          name: result.updatedUser.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.json({
        success: true,
        message: "Seller profile created successfully",
        profile: result.sellerProfile,
        profilePhoto: result.photoUrl,
        accessToken: newToken,
      });
    } catch (error) {
      console.error("Become seller error:", error);
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      const statusCode = error.message.includes("already a seller") ? 400 : 500;
      res.status(statusCode).json({
        error: error.message.includes("already a seller")
          ? error.message
          : "Failed to create seller profile",
        code: error.message.replace(/\s+/g, "_").toUpperCase(),
      });
    }
  }
);

export default router;
