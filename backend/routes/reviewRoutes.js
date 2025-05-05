import express from "express";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../middleware/authMiddleware.js";
import DOMPurify from "dompurify";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator"; // Added validationResult
import { notifyReviewSubmitted } from "../utils/notify.js"; // Import notification utility

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 review actions per window
  keyGenerator: (req) => req.user.id,
});

// Review validation
const validateReview = [
  body("serviceId").isString().notEmpty(),
  body("rating").isInt({ min: 1, max: 5 }),
  body("comment").optional().isString().trim().isLength({ max: 1000 }),
];

// Submit review
router.post(
  "/reviews",
  authenticateToken,
  reviewLimiter,
  validateReview,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg,
        code: "VALIDATION_ERROR",
      });
    }

    const { serviceId, rating, comment } = req.body;

    try {
      // Verify order completion
      const completedOrder = await prisma.order.findFirst({
        where: {
          serviceId,
          buyerId: req.user.id,
          status: "COMPLETED", // Changed to uppercase to match schema
        },
        select: { sellerId: true },
      });

      if (!completedOrder) {
        return res.status(403).json({
          error: "You can only review completed orders",
          code: "ORDER_NOT_COMPLETED",
        });
      }

      // Check for existing review
      const existingReview = await prisma.review.findFirst({
        where: {
          serviceId,
          buyerId: req.user.id,
        },
      });

      if (existingReview) {
        return res.status(400).json({
          error: "You've already reviewed this service",
          code: "DUPLICATE_REVIEW",
        });
      }

      // Create review in transaction
      const review = await prisma.$transaction(async (tx) => {
        const newReview = await tx.review.create({
          data: {
            serviceId,
            buyerId: req.user.id,
            sellerId: completedOrder.sellerId,
            rating: Math.min(5, Math.max(1, rating)),
            comment: comment ? DOMPurify.sanitize(comment.trim()) : null,
          },
          include: {
            buyer: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                title: true,
              },
            },
            seller: {
              // Added to get seller email
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Update service average rating
        await tx.service.update({
          where: { id: serviceId },
          data: {
            averageRating: await tx.review
              .aggregate({
                where: { serviceId },
                _avg: { rating: true },
              })
              .then((res) => res._avg.rating),
          },
        });

        return newReview;
      });

      // Send review notification to seller
      if (review.seller.email) {
        try {
          const notificationResult = await notifyReviewSubmitted({
            sellerEmail: review.seller.email,
            sellerName: review.seller.name,
            buyerName: review.buyer.name,
            serviceTitle: review.service.title,
            rating,
            comment: comment || null,
            reviewId: review.id,
          });
          if (!notificationResult.success) {
            console.error(
              `ServiceSoko: Failed to notify seller ${review.seller.id} for review ${review.id}:`,
              notificationResult.error
            );
          }
        } catch (notificationError) {
          console.error(
            `ServiceSoko: Notification error for review ${review.id}:`,
            notificationError.message
          );
        }
      }

      res.status(201).json({
        success: true,
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
          buyer: review.buyer,
          service: review.service,
        },
      });
    } catch (error) {
      console.error("Review submission error:", error);
      res.status(500).json({
        error: "Failed to submit review",
        code: "REVIEW_SUBMISSION_FAILED",
      });
    }
  }
);

// Get service reviews
router.get(
  "/services/:serviceId/reviews",
  param("serviceId").isString().notEmpty(),
  async (req, res) => {
    const { serviceId } = req.params;

    try {
      const reviews = await prisma.review.findMany({
        where: { serviceId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          buyer: {
            select: {
              id: true,
              name: true,
              sellerProfile: {
                select: {
                  profilePhoto: true,
                },
              },
            },
          },
        },
        take: 50, // Limit to 50 most recent reviews
      });

      res.json({
        success: true,
        reviews: reviews.map((r) => ({
          ...r,
          comment: r.comment ? DOMPurify.sanitize(r.comment) : null,
          buyer: {
            id: r.buyer.id,
            name: DOMPurify.sanitize(r.buyer.name),
            profilePhoto: r.buyer.sellerProfile?.profilePhoto,
          },
        })),
      });
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({
        error: "Failed to fetch reviews",
        code: "REVIEWS_FETCH_FAILED",
      });
    }
  }
);

// Delete review (optional)
router.delete(
  "/reviews/:id",
  authenticateToken,
  param("id").isString().notEmpty(),
  async (req, res) => {
    try {
      const review = await prisma.review.findUnique({
        where: { id: req.params.id },
      });

      if (!review) {
        return res.status(404).json({
          error: "Review not found",
          code: "REVIEW_NOT_FOUND",
        });
      }

      if (review.buyerId !== req.user.id) {
        return res.status(403).json({
          error: "You can only delete your own reviews",
          code: "UNAUTHORIZED_DELETE",
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.review.delete({ where: { id: review.id } });

        // Update service average rating
        await tx.service.update({
          where: { id: review.serviceId },
          data: {
            averageRating: await tx.review
              .aggregate({
                where: { serviceId: review.serviceId },
                _avg: { rating: true },
              })
              .then((res) => res._avg.rating),
          },
        });
      });

      res.json({ success: true, message: "Review deleted" });
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({
        error: "Failed to delete review",
        code: "REVIEW_DELETE_FAILED",
      });
    }
  }
);

export default router;
