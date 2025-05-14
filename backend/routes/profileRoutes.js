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
  limits: { fileSize: 10 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG,JPG and PNG images are allowed"));
  },
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
        location: true,
        role: true,
        name: true,
        bio: true,
        profilePhoto: true,
        sellerProfile: {
          select: {
            location: true,
            gender: true,
            phone: true,
            profilePhoto: true,
            services: true,
            experience: true,
            isComplete: true,
            bio: true,
            ratings: true,
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
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    console.log(
      `Raw SellerProfile from database for user ${req.user.id}:`,
      JSON.stringify(user.sellerProfile, null, 2)
    );

    console.log(
      `Profile fetched for user ${req.user.id}:`,
      JSON.stringify(
        {
          user: {
            ...user,
            sellerProfile: user.sellerProfile || null,
            profileComplete: !!user.sellerProfile?.isComplete,
          },
        },
        null,
        2
      )
    );

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
router.put(
  "/profile",
  authenticateToken,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      const { name, email, location, phone, services, bio } = req.body;
      const profilePhoto = req.file
        ? `/Uploads/profiles/${req.file.filename}`
        : undefined;

      // Validate required fields
      if (!name?.trim() || !email?.trim()) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          message: "Name and email are required",
          code: "MISSING_FIELDS",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          message: "Invalid email format",
          code: "INVALID_EMAIL_FORMAT",
        });
      }

      // Sanitize inputs
      const sanitizedPhone = phone && DOMPurify.sanitize(phone.trim());
      const sanitizedLocation = location && DOMPurify.sanitize(location.trim());
      const sanitizedBio = bio && DOMPurify.sanitize(bio.trim());

      // Check for email uniqueness (excluding the current user)
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: email.trim(),
          id: { not: userId },
        },
      });
      if (existingEmail) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({
          message: "Email already in use by another account",
          code: "EMAIL_ALREADY_IN_USE",
        });
      }

      // Check for phone number uniqueness
      if (sanitizedPhone) {
        const existingUser = await prisma.user.findFirst({
          where: {
            phone: sanitizedPhone,
            id: { not: userId },
          },
        });

        if (existingUser) {
          if (req.file) fs.unlink(req.file.path, () => {});
          return res.status(400).json({
            message: "Phone number already in use by another account",
            code: "PHONE_ALREADY_IN_USE",
          });
        }
      }

      // Prepare update data for User
      const updateData = {
        name: name.trim(),
        email: email.trim(),
      };
      if (sanitizedPhone) updateData.phone = sanitizedPhone;
      if (sanitizedLocation) updateData.location = sanitizedLocation;
      if (sanitizedBio) updateData.bio = sanitizedBio;
      if (profilePhoto) updateData.profilePhoto = profilePhoto;

      console.log("User update data:", updateData);

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          phone: true,
          location: true,
          role: true,
          name: true,
          bio: true,
          profilePhoto: true,
          sellerProfile: {
            select: {
              location: true,
              gender: true,
              phone: true,
              profilePhoto: true,
              services: true,
              experience: true,
              isComplete: true,
              bio: true,
              ratings: true,
            },
          },
        },
      });

      // Seller-specific profile update
      if (role === "SELLER" || role === "BOTH") {
        // Ensure SellerProfile exists
        const existingProfile = await prisma.sellerProfile.findUnique({
          where: { userId },
        });
        if (!existingProfile) {
          console.log(`Creating new SellerProfile for user ${userId}`);
          await prisma.sellerProfile.create({
            data: {
              userId,
              name: name.trim(),
              location: sanitizedLocation || "",
              isComplete: false,
            },
          });
        }

        const sellerUpdateData = {};

        if (sanitizedLocation) sellerUpdateData.location = sanitizedLocation;
        if (sanitizedPhone) sellerUpdateData.phone = sanitizedPhone;
        if (sanitizedBio) sellerUpdateData.bio = sanitizedBio;
        if (services) {
          sellerUpdateData.services =
            typeof services === "string"
              ? services
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              : Array.isArray(services)
              ? services
              : [];
        }
        if (profilePhoto) sellerUpdateData.profilePhoto = profilePhoto;
        sellerUpdateData.isComplete = true;

        console.log("Seller update data:", sellerUpdateData);

        const updatedSellerProfile = await prisma.sellerProfile.update({
          where: { userId },
          data: sellerUpdateData,
          select: {
            location: true,
            gender: true,
            phone: true,
            profilePhoto: true,
            services: true,
            experience: true,
            isComplete: true,
            bio: true,
            ratings: true,
          },
        });

        return res.json({
          message: "Profile updated successfully",
          user: {
            ...updatedUser,
            sellerProfile: updatedSellerProfile,
            profileComplete: !!updatedSellerProfile?.isComplete,
          },
        });
      }

      // Buyer-only user response
      return res.json({
        message: "Profile updated successfully",
        user: {
          ...updatedUser,
          profileComplete: !!updatedUser.sellerProfile?.isComplete,
        },
      });
    } catch (error) {
      console.error("Profile update error:", error);
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(500).json({
        message: "Failed to update profile",
        error: error.message,
        code: "PROFILE_UPDATE_FAILED",
      });
    }
  }
);

// Become a seller
router.post(
  "/become-seller",
  authenticateToken,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const { name, phone, location, gender, bio, services } = req.body;
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
      const cleanBio = bio ? DOMPurify.sanitize(bio.trim()) : null;
      const cleanServices =
        typeof services === "string"
          ? services
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      console.log("Creating seller profile with data:", {
        userId: req.user.id,
        name: cleanName,
        phone: cleanPhone,
        location: cleanLocation,
        gender: cleanGender,
        profilePhoto: req.file ? `/Uploads/profiles/${req.file.filename}` : null,
        services: cleanServices,
        bio: cleanBio,
      });

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
            services: cleanServices,
            bio: cleanBio,
            isComplete: true,
          },
        });
        const updatedUser = await tx.user.update({
          where: { id: req.user.id },
          data: {
            role: "BOTH",
            profilePhoto: photoUrl,
            bio: cleanBio,
          },
          select: {
            id: true,
            email: true,
            phone: true,
            location: true,
            role: true,
            name: true,
            bio: true,
            profilePhoto: true,
          },
        });
        return { sellerProfile, photoUrl, updatedUser };
      });

      console.log(
        `Seller profile created for user ${req.user.id}:`,
        JSON.stringify(result.sellerProfile, null, 2)
      );

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