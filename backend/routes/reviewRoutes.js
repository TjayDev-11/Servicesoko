import express from "express";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import {
  notifyReviewSubmitted,
  notifyReviewSubmittedSMS,
} from "../utils/notify.js";

const router = express.Router();
const prisma = new PrismaClient();
const { window } = new JSDOM("");
const domPurify = DOMPurify(window);

// Rate limiting for review submission
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each user to 5 review submissions per window
  keyGenerator: (req) => req.user.id, // Limit by user ID
  message: {
    error: "Too many review submissions",
    code: "RATE_LIMITED",
    message: "Please try again later",
  },
});

// Submit a review for an order
router.post(
  "/orders/:orderId/review",
  authenticateToken,
  reviewLimiter,
  async (req, res) => {
    const { orderId } = req.params;
    const { rating, comment } = req.body;

    try {
      // Validate input
      if (!rating || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "Rating must be between 1 and 5" });
      }

      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          buyer: { select: { id: true, name: true, email: true, phone: true } },
          seller: { 
            select: { 
              id: true, 
              name: true, 
              email: true, 
              phone: true,
              sellerProfile: { select: { userId: true } }
            } 
          },
          service: { select: { id: true, title: true } },
        },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Check if the user is the buyer
      if (order.buyerId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Only the buyer can submit a review" });
      }

      // Check if the order is completed
      if (order.status !== "COMPLETED") {
        return res
          .status(400)
          .json({ error: "Order must be completed to submit a review" });
      }

      // Check for existing review
      const existingReview = await prisma.review.findFirst({
        where: {
          orderId: order.id,
          userId: req.user.id,
        },
      });

      if (existingReview) {
        return res
          .status(400)
          .json({ error: "You have already reviewed this order" });
      }

      // Create the review within a transaction
      const [newReview] = await prisma.$transaction([
        prisma.review.create({
          data: {
            orderId: order.id,
            userId: req.user.id,
            sellerId: order.seller.sellerProfile.userId,
            rating: Math.min(5, Math.max(1, rating)),
            comment: comment ? domPurify.sanitize(comment.trim()) : null,
          },
          include: {
            order: { select: { id: true } },
            user: { select: { id: true, name: true } },
            seller: { select: { userId: true } },
          },
        }),
        // Update seller profile ratings
        prisma.sellerProfile.update({
          where: { userId: order.sellerId },
          data: {
            ratings: {
              push: rating,
            },
          },
        }),
      ]);

      // Send review submitted notifications
      const notificationParams = {
        sellerEmail: order.seller.email,
        sellerName: order.seller.name,
        sellerPhone: order.seller.phone,
        buyerName: order.buyer.name,
        serviceTitle: order.service.title,
        orderId: order.id,
        rating,
        comment: newReview.comment,
      };

      // Email notification
      console.log(
        `ServiceSoko: Attempting review submitted email notification for order ${order.id}`
      );
      try {
        const emailResult = await notifyReviewSubmitted(notificationParams);
        console.log(
          `ServiceSoko: Review submitted email notification for order ${order.id}:`,
          emailResult
        );
        if (!emailResult.success) {
          console.error(
            `ServiceSoko: Failed to send review submitted email notification to ${notificationParams.sellerEmail}:`,
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error(
          `ServiceSoko: Error sending review submitted email notification for order ${order.id}:`,
          emailError.message,
          emailError.stack
        );
      }

      // SMS notification
      console.log(
        `ServiceSoko: Attempting review submitted SMS notification for order ${order.id}`
      );
      try {
        const smsResult = await notifyReviewSubmittedSMS(notificationParams);
        console.log(
          `ServiceSoko: Review submitted SMS notification for order ${order.id}:`,
          smsResult
        );
        if (!smsResult.success) {
          console.error(
            `ServiceSoko: Failed to send review submitted SMS notification to ${notificationParams.sellerPhone}:`,
            smsResult.error
          );
        }
      } catch (smsError) {
        console.error(
          `ServiceSoko: Error sending review submitted SMS notification for order ${order.id}:`,
          smsError.message,
          smsError.stack
        );
      }

      res.json({
        message: "Review submitted successfully",
        review: {
          id: newReview.id,
          orderId: newReview.orderId,
          userId: newReview.userId,
          sellerId: newReview.sellerId,
          rating: newReview.rating,
          comment: newReview.comment,
          createdAt: newReview.createdAt,
        },
      });
    } catch (error) {
      console.error("Review submission error:", error);
      res.status(500).json({
        error: "Failed to submit review",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

export default router;