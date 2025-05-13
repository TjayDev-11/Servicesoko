import express from "express";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../middleware/authMiddleware.js";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { notifyServiceAdded, notifyServiceAddedSMS } from "../utils/notify.js";

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer();

const { window } = new JSDOM("");
const DOMPurify = createDOMPurify(window);

// Normalize title to ensure consistency
const normalizeTitle = (title) => {
  if (!title) return "";
  return title.trim().replace(/\s+/g, " ").toLowerCase();
};

// Rate limiting for service creation
const serviceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 service creation requests per window
  keyGenerator: (req) => req.user.id, // Limit by user ID
  message: {
    error: "Too many service creation requests",
    code: "RATE_LIMITED",
    message: "Please try again later",
  },
});

// Create a service
router.post(
  "/services",
  authenticateToken,
  serviceLimiter,
  upload.none(),
  async (req, res) => {
    const { title, description, price, category, experience } = req.body;

    // Validation
    if (!title?.trim() || !description?.trim() || !price || !category) {
      return res
        .status(400)
        .json({ error: "All fields except experience are required" });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    let parsedExperience = null;
    if (experience !== undefined && experience !== null) {
      parsedExperience = parseInt(experience);
      if (isNaN(parsedExperience) || parsedExperience < 0) {
        return res.status(400).json({ error: "Invalid experience value" });
      }
    }

    try {
      // Verify seller profile
      const sellerProfile = await prisma.sellerProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!sellerProfile) {
        return res.status(403).json({
          error: "Complete your seller profile first",
          code: "MISSING_PROFILE",
        });
      }

      if (!["SELLER", "BOTH"].includes(req.user.role)) {
        return res.status(403).json({
          error: "Only sellers can add services",
        });
      }

      // Transaction for data consistency
      const result = await prisma.$transaction(async (tx) => {
        const normalizedCategory =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        const sanitizedTitle = DOMPurify.sanitize(title.trim());
        const normalizedTitleValue = normalizeTitle(sanitizedTitle);

        const categoryRecord = await tx.category.upsert({
          where: { name: normalizedCategory },
          create: { name: normalizedCategory },
          update: {},
        });

        let service = await tx.service.findFirst({
          where: {
            title: sanitizedTitle,
            categoryId: categoryRecord.id,
          },
        });

        if (!service) {
          service = await tx.service.create({
            data: {
              title: sanitizedTitle,
              categoryId: categoryRecord.id,
            },
          });
        }

        const existingServiceSeller = await tx.serviceSeller.findFirst({
          where: {
            AND: [{ serviceId: service.id }, { sellerId: req.user.id }],
          },
        });

        if (existingServiceSeller) {
          throw new Error("You already offer this service");
        }

        const serviceSeller = await tx.serviceSeller.create({
          data: {
            serviceId: service.id,
            sellerId: req.user.id,
            description: DOMPurify.sanitize(description.trim()),
            price: parsedPrice,
            experience: parsedExperience,
          },
        });

        // Update sellerProfile.services with normalized title
        await tx.sellerProfile.update({
          where: { userId: req.user.id },
          data: {
            services: {
              push: normalizedTitleValue,
            },
          },
        });

        return { service, serviceSeller, category: categoryRecord.name };
      });

      // Send notifications
      if (req.user.email) {
        console.log(
          `ServiceSoko: Attempting service added email notification for user ${req.user.id}, email: ${req.user.email}`
        );
        try {
          const notificationResult = await notifyServiceAdded({
            userEmail: req.user.email,
            userName: req.user.name,
            serviceTitle: result.service.title,
            category: result.category,
          });
          console.log(
            `ServiceSoko: Service added email notification for user ${req.user.id}:`,
            notificationResult
          );
          if (!notificationResult.success) {
            console.error(
              `ServiceSoko: Failed to send service added email notification to ${req.user.email}:`,
              notificationResult.error
            );
          }
        } catch (notificationError) {
          console.error(
            `ServiceSoko: Error sending service added email notification to ${req.user.email}:`,
            notificationError.message,
            notificationError.stack
          );
        }
      } else {
        console.log(
          `ServiceSoko: Skipping service added email notification for user ${req.user.id}: No email provided`
        );
      }

      if (req.user.phone) {
        console.log(
          `ServiceSoko: Attempting service added SMS notification for user ${req.user.id}, phone: ${req.user.phone}`
        );
        try {
          const smsResult = await notifyServiceAddedSMS({
            userPhone: req.user.phone,
            userName: req.user.name,
            serviceTitle: result.service.title,
            category: result.category,
          });
          console.log(
            `ServiceSoko: Service added SMS notification for user ${req.user.id}:`,
            smsResult
          );
          if (!smsResult.success) {
            console.error(
              `ServiceSoko: Failed to send service added SMS notification to ${req.user.phone}:`,
              smsResult.error
            );
          }
        } catch (smsError) {
          console.error(
            `ServiceSoko: Error sending service added SMS notification to ${req.user.phone}:`,
            smsError.message,
            smsError.stack
          );
        }
      } else {
        console.log(
          `ServiceSoko: Skipping service added SMS notification for user ${req.user.id}: No phone provided`
        );
      }

      res.json({
        message: "Service added successfully!",
        service: {
          id: result.service.id,
          title: result.service.title,
          category: result.category,
        },
        serviceSeller: {
          id: result.serviceSeller.id,
          description: result.serviceSeller.description,
          price: result.serviceSeller.price,
          experience: result.serviceSeller.experience,
        },
      });
    } catch (error) {
      console.error("Service creation error:", error);
      const statusCode = error.message.includes("already offer") ? 400 : 500;
      res.status(statusCode).json({
        error: error.message.includes("already offer")
          ? error.message
          : "Service creation failed",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get all services
router.get("/services", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        serviceSellers: {
          include: {
            seller: {
              include: {
                sellerProfile: {
                  select: {
                    ratings: true,
                    profilePhoto: true,
                    location: true,
                    phone: true,
                    bio: true,
                    services: true,
                  },
                },
              },
            },
          },
        },
        category: true,
      },
    });

    const servicesWithSellerRatings = services.map((service) => {
      const sellers = service.serviceSellers.map((serviceSeller) => {
        const seller = serviceSeller.seller;
        const sellerProfile = seller.sellerProfile;
        const ratings = sellerProfile?.ratings || [];
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : 0;

        return {
          id: seller.id,
          name: seller.name,
          profilePhoto: sellerProfile?.profilePhoto || seller.profilePhoto || null,
          image: sellerProfile?.profilePhoto || seller.profilePhoto || null,
          bio: sellerProfile?.bio || seller.bio || null,
          rating: avgRating,
          reviewsCount: ratings.length,
          location: sellerProfile?.location || "Not specified",
          phone: sellerProfile?.phone || "Not provided",
          description: serviceSeller.description || "No description provided",
          price: serviceSeller.price || 0,
          experience: serviceSeller.experience || null,
          ratings: ratings,
        };
      });

      return {
        id: service.id,
        title: service.title,
        category: service.category?.name || "uncategorized",
        professionalCount: service.serviceSellers.length,
        sellers,
      };
    });

    res.json({
      message: "Available services",
      services: servicesWithSellerRatings,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      error: "Failed to fetch services",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get user's services
router.get("/services/user", authenticateToken, async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        serviceSellers: {
          some: {
            sellerId: req.user.id,
          },
        },
      },
      include: {
        category: true,
        serviceSellers: {
          where: {
            sellerId: req.user.id,
          },
          include: {
            seller: {
              include: {
                sellerProfile: true,
              },
            },
          },
        },
      },
    });

    const userServices = services.map((service) => {
      const serviceSeller = service.serviceSellers[0]; // Only the user's serviceSeller
      if (!serviceSeller) {
        console.warn(`No serviceSeller found for service ${service.id}, user ${req.user.id}`);
        return null;
      }
      return {
        id: service.id,
        title: service.title,
        category: service.category?.name || "uncategorized",
        description: serviceSeller.description || "No description provided",
        price: serviceSeller.price || 0,
        experience: serviceSeller.experience || null,
      };
    }).filter(service => service !== null);

    res.json({
      message: "Your services",
      services: userServices,
    });
  } catch (error) {
    console.error("Error fetching user services:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    res.status(500).json({
      error: "Failed to fetch your services",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get sellers for a specific service
router.get("/services/:id/sellers", async (req, res) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        serviceSellers: {
          include: {
            seller: {
              include: {
                sellerProfile: {
                  select: {
                    ratings: true,
                    profilePhoto: true,
                    location: true,
                    phone: true,
                    bio: true,
                    services: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!service) return res.status(404).json({ error: "Service not found" });

    const sellers = service.serviceSellers.map((serviceSeller) => {
      const seller = serviceSeller.seller;
      const sellerProfile = seller.sellerProfile;
      const ratings = sellerProfile?.ratings || [];
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
          : 0;

      return {
        id: seller.id,
        name: seller.name,
        profilePhoto: sellerProfile?.profilePhoto || seller.profilePhoto || null,
        image: sellerProfile?.profilePhoto || seller.profilePhoto || null,
        bio: sellerProfile?.bio || seller.bio || null,
        phone: sellerProfile?.phone || "Not provided",
        services: sellerProfile?.services,
        location: sellerProfile?.location,
        description: serviceSeller.description || "No description provided",
        price: serviceSeller.price || 0,
        rating: avgRating,
        experience: serviceSeller.experience || null,
        ratings: ratings,
      };
    });

    res.json({ message: "Sellers offering this service", sellers });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({
      error: "Failed to fetch sellers",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete a service
router.delete("/services/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify the service exists and belongs to the user
    const serviceSeller = await prisma.serviceSeller.findFirst({
      where: {
        serviceId: id,
        sellerId: req.user.id,
      },
      include: {
        service: true, // Include service to access title
      },
    });

    if (!serviceSeller) {
      return res.status(404).json({
        error: "Service not found or you do not have permission to delete it",
      });
    }

    // Normalize the service title for comparison
    const normalizedServiceTitle = normalizeTitle(serviceSeller.service.title);
    console.log(`Deleting service with ID: ${id}, Normalized title: ${normalizedServiceTitle}`);

    // Transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Delete the serviceSeller record
      await tx.serviceSeller.delete({
        where: {
          id: serviceSeller.id,
        },
      });

      // Delete the service if no other sellers are associated
      const remainingSellers = await tx.serviceSeller.count({
        where: { serviceId: id },
      });

      if (remainingSellers === 0) {
        await tx.service.delete({
          where: { id },
        });
        console.log(`Service with ID ${id} deleted as no other sellers are associated`);
      }

      // Update seller profile to remove the service from services array
      const sellerProfile = await tx.sellerProfile.findUnique({
        where: { userId: req.user.id },
      });

      if (!sellerProfile) {
        console.warn(`No seller profile found for user ${req.user.id}`);
        return;
      }

      if (sellerProfile.services && sellerProfile.services.length > 0) {
        const updatedServices = sellerProfile.services.filter(
          (serviceTitle) => normalizeTitle(serviceTitle) !== normalizedServiceTitle
        );
        console.log(`Original services: ${sellerProfile.services}, Updated services: ${updatedServices}`);

        if (updatedServices.length !== sellerProfile.services.length) {
          await tx.sellerProfile.update({
            where: { userId: req.user.id },
            data: { services: updatedServices },
          });
          console.log(`SellerProfile.services updated for user ${req.user.id}`);
        } else {
          console.log(`No changes to SellerProfile.services for user ${req.user.id}`);
        }
      } else {
        console.log(`SellerProfile.services is empty or null for user ${req.user.id}`);
      }
    });

    res.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Service deletion error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      error: "Failed to delete service",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;