import express from "express";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../middleware/authMiddleware.js";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import rateLimit from "express-rate-limit";
import { notifyServiceAdded, notifyServiceAddedSMS } from "../utils/notify.js";

const router = express.Router();
const prisma = new PrismaClient();

const { window } = new JSDOM("");
const DOMPurify = createDOMPurify(window);

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

// Get all services
router.get("/services", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: {
        reviews: true,
        serviceSellers: {
          include: {
            seller: {
              include: {
                sellerProfile: true,
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
        const sellerReviews = service.reviews.filter(
          (review) => review.sellerId === seller.id
        );
        const avgRating =
          sellerReviews.length > 0
            ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) /
              sellerReviews.length
            : 0;

        return {
          id: seller.id,
          name: seller.name,
          rating: avgRating,
          reviewsCount: sellerReviews.length,
          location: seller.sellerProfile?.location || "Not specified",
          phone: seller.sellerProfile?.phone || "Not provided",
          description: serviceSeller.description || "No description provided",
          price: serviceSeller.price || 0,
          experience: serviceSeller.experience || null,
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

// Get user-specific services
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
      return {
        id: service.id,
        title: service.title,
        category: service.category?.name || "uncategorized",
        description: serviceSeller.description || "No description provided",
        price: serviceSeller.price || 0,
        experience: serviceSeller.experience || null,
      };
    });

    res.json({
      message: "Your services",
      services: userServices,
    });
  } catch (error) {
    console.error("Error fetching user services:", error);
    res.status(500).json({
      error: "Failed to fetch your services",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Create a service
router.post(
  "/services",
  authenticateToken,
  serviceLimiter,
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

        const categoryRecord = await tx.category.upsert({
          where: { name: normalizedCategory },
          create: { name: normalizedCategory },
          update: {},
        });

        let service = await tx.service.findFirst({
          where: {
            title: DOMPurify.sanitize(title.trim()),
            categoryId: categoryRecord.id,
          },
        });

        if (!service) {
          service = await tx.service.create({
            data: {
              title: DOMPurify.sanitize(title.trim()),
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

        await tx.sellerProfile.update({
          where: { userId: req.user.id },
          data: {
            services: {
              push: service.title,
            },
          },
        });

        return { service, serviceSeller, category: categoryRecord.name };
      });

      // Send service added email notification
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

      // Send service added SMS notification
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
                sellerProfile: true,
                reviews: {
                  where: { serviceId: id },
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
      const avgRating =
        seller.reviews.length > 0
          ? seller.reviews.reduce((sum, r) => sum + r.rating, 0) /
            seller.reviews.length
          : 0;

      return {
        id: seller.id,
        name: seller.name,
        phone: seller.sellerProfile?.phone || "Not provided",
        services: seller.sellerProfile?.services,
        location: seller.sellerProfile?.location,
        description: serviceSeller.description || "No description provided",
        price: serviceSeller.price || 0,
        rating: avgRating,
        experience: serviceSeller.experience || null,
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

export default router;
