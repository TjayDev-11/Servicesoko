import express from "express";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import {
  notifyOrderConfirmation,
  notifyOrderConfirmationSMS,
  notifyOrderAccepted,
  notifyOrderAcceptedSMS,
  notifyOrderRejected,
  notifyOrderRejectedSMS,
  notifyOrderCompleted,
  notifyOrderCompletedSMS,
  notifyOrderCancelled,
  notifyOrderCancelledSMS,
  notifyReviewSubmitted,
  notifyReviewSubmittedSMS,
} from "../utils/notify.js";

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting for order creation and updates
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each user to 10 order requests per window
  keyGenerator: (req) => req.user.id, // Limit by user ID
  message: {
    error: "Too many order requests",
    code: "RATE_LIMITED",
    message: "Please try again later",
  },
});

// Create an order
router.post("/orders", authenticateToken, orderLimiter, async (req, res) => {
  const { serviceId, sellerId, bookingDate } = req.body;

  try {
    // Validation
    if (!serviceId || !sellerId || !bookingDate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const parsedBookingDate = new Date(bookingDate);
    if (isNaN(parsedBookingDate.getTime())) {
      return res.status(400).json({ error: "Invalid booking date" });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { category: true },
    });
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      include: { sellerProfile: true },
    });
    if (!seller || !["SELLER", "BOTH", "ADMIN"].includes(seller.role)) {
      return res.status(404).json({ error: "Seller not found" });
    }

    const serviceSeller = await prisma.serviceSeller.findUnique({
      where: { serviceId_sellerId: { serviceId, sellerId } },
    });
    if (!serviceSeller) {
      return res
        .status(404)
        .json({ error: "Seller does not offer this service" });
    }

    const order = await prisma.order.create({
      data: {
        buyerId: req.user.id,
        sellerId,
        serviceId,
        bookingDate: parsedBookingDate,
        status: "PENDING",
      },
      include: {
        buyer: true,
        seller: true,
        service: true,
      },
    });

    // Send order confirmation notifications
    const notificationParams = {
      buyerEmail: order.buyer.email,
      buyerName: order.buyer.name,
      buyerPhone: order.buyer.phone,
      sellerEmail: order.seller.email,
      sellerName: order.seller.name,
      sellerPhone: order.seller.phone,
      serviceTitle: order.service.title,
      orderId: order.id,
      bookingDate: order.bookingDate,
    };

    // Email notifications
    console.log(
      `ServiceSoko: Attempting order confirmation email notifications for order ${order.id}`
    );
    try {
      const emailResults = await notifyOrderConfirmation(notificationParams);
      console.log(
        `ServiceSoko: Order confirmation email notifications for order ${order.id}:`,
        emailResults
      );
      if (!emailResults.buyerEmail.success) {
        console.error(
          `ServiceSoko: Failed to send buyer email notification to ${notificationParams.buyerEmail}:`,
          emailResults.buyerEmail.error
        );
      }
      if (!emailResults.sellerEmail.success) {
        console.error(
          `ServiceSoko: Failed to send seller email notification to ${notificationParams.sellerEmail}:`,
          emailResults.sellerEmail.error
        );
      }
    } catch (emailError) {
      console.error(
        `ServiceSoko: Error sending order confirmation email notifications for order ${order.id}:`,
        emailError.message,
        emailError.stack
      );
    }

    // SMS notifications
    console.log(
      `ServiceSoko: Attempting order confirmation SMS notifications for order ${order.id}`
    );
    try {
      const smsResults = await notifyOrderConfirmationSMS(notificationParams);
      console.log(
        `ServiceSoko: Order confirmation SMS notifications for order ${order.id}:`,
        smsResults
      );
      if (!smsResults.buyer.success) {
        console.error(
          `ServiceSoko: Failed to send buyer SMS notification to ${notificationParams.buyerPhone}:`,
          smsResults.buyer.error
        );
      }
      if (!smsResults.seller.success) {
        console.error(
          `ServiceSoko: Failed to send seller SMS notification to ${notificationParams.sellerPhone}:`,
          smsResults.seller.error
        );
      }
    } catch (smsError) {
      console.error(
        `ServiceSoko: Error sending order confirmation SMS notifications for order ${order.id}:`,
        smsError.message,
        smsError.stack
      );
    }

    res.json({
      message: "Order placed successfully",
      order: {
        id: order.id,
        serviceId: order.serviceId,
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        bookingDate: order.bookingDate,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      error: "Failed to create order",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Accept an order
router.put(
  "/orders/:id/accept",
  authenticateToken,
  orderLimiter,
  async (req, res) => {
    const { id } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { buyer: true, seller: true, service: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.sellerId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Only the seller can accept this order" });
      }

      if (order.status !== "PENDING") {
        return res
          .status(400)
          .json({ error: "Order is not in pending status" });
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "ACCEPTED" },
        include: { buyer: true, seller: true, service: true },
      });

      // Send order accepted notifications
      const notificationParams = {
        buyerEmail: updatedOrder.buyer.email,
        buyerName: updatedOrder.buyer.name,
        buyerPhone: updatedOrder.buyer.phone,
        sellerName: updatedOrder.seller.name,
        serviceTitle: updatedOrder.service.title,
        orderId: updatedOrder.id,
        bookingDate: updatedOrder.bookingDate,
      };

      // Email notification
      console.log(
        `ServiceSoko: Attempting order accepted email notification for order ${updatedOrder.id}`
      );
      try {
        const emailResult = await notifyOrderAccepted(notificationParams);
        console.log(
          `ServiceSoko: Order accepted email notification for order ${updatedOrder.id}:`,
          emailResult
        );
        if (!emailResult.success) {
          console.error(
            `ServiceSoko: Failed to send order accepted email notification to ${notificationParams.buyerEmail}:`,
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error(
          `ServiceSoko: Error sending order accepted email notification for order ${updatedOrder.id}:`,
          emailError.message,
          emailError.stack
        );
      }

      // SMS notification
      console.log(
        `ServiceSoko: Attempting order accepted SMS notification for order ${updatedOrder.id}`
      );
      try {
        const smsResult = await notifyOrderAcceptedSMS(notificationParams);
        console.log(
          `ServiceSoko: Order accepted SMS notification for order ${updatedOrder.id}:`,
          smsResult
        );
        if (!smsResult.success) {
          console.error(
            `ServiceSoko: Failed to send order accepted SMS notification to ${notificationParams.buyerPhone}:`,
            smsResult.error
          );
        }
      } catch (smsError) {
        console.error(
          `ServiceSoko: Error sending order accepted SMS notification for order ${updatedOrder.id}:`,
          smsError.message,
          smsError.stack
        );
      }

      res.json({
        message: "Order accepted successfully",
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
        },
      });
    } catch (error) {
      console.error("Order accept error:", error);
      res.status(500).json({
        error: "Failed to accept order",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Reject an order
router.put(
  "/orders/:id/reject",
  authenticateToken,
  orderLimiter,
  async (req, res) => {
    const { id } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { buyer: true, seller: true, service: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.sellerId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Only the seller can reject this order" });
      }

      if (order.status !== "PENDING") {
        return res
          .status(400)
          .json({ error: "Order is not in pending status" });
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "REJECTED" },
        include: { buyer: true, seller: true, service: true },
      });

      // Send order rejected notifications
      const notificationParams = {
        buyerEmail: updatedOrder.buyer.email,
        buyerName: updatedOrder.buyer.name,
        buyerPhone: updatedOrder.buyer.phone,
        sellerName: updatedOrder.seller.name,
        serviceTitle: updatedOrder.service.title,
        orderId: updatedOrder.id,
        bookingDate: updatedOrder.bookingDate,
      };

      // Email notification
      console.log(
        `ServiceSoko: Attempting order rejected email notification for order ${updatedOrder.id}`
      );
      try {
        const emailResult = await notifyOrderRejected(notificationParams);
        console.log(
          `ServiceSoko: Order rejected email notification for order ${updatedOrder.id}:`,
          emailResult
        );
        if (!emailResult.success) {
          console.error(
            `ServiceSoko: Failed to send order rejected email notification to ${notificationParams.buyerEmail}:`,
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error(
          `ServiceSoko: Error sending order rejected email notification for order ${updatedOrder.id}:`,
          emailError.message,
          emailError.stack
        );
      }

      // SMS notification
      console.log(
        `ServiceSoko: Attempting order rejected SMS notification for order ${updatedOrder.id}`
      );
      try {
        const smsResult = await notifyOrderRejectedSMS(notificationParams);
        console.log(
          `ServiceSoko: Order rejected SMS notification for order ${updatedOrder.id}:`,
          smsResult
        );
        if (!smsResult.success) {
          console.error(
            `ServiceSoko: Failed to send order rejected SMS notification to ${notificationParams.buyerPhone}:`,
            smsResult.error
          );
        }
      } catch (smsError) {
        console.error(
          `ServiceSoko: Error sending order rejected SMS notification for order ${updatedOrder.id}:`,
          smsError.message,
          smsError.stack
        );
      }

      res.json({
        message: "Order rejected successfully",
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
        },
      });
    } catch (error) {
      console.error("Order reject error:", error);
      res.status(500).json({
        error: "Failed to reject order",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Complete an order
router.put(
  "/orders/:id/complete",
  authenticateToken,
  orderLimiter,
  async (req, res) => {
    const { id } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { buyer: true, seller: true, service: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.sellerId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Only the seller can complete this order" });
      }

      if (!["ACCEPTED", "IN_PROGRESS"].includes(order.status)) {
        return res
          .status(400)
          .json({ error: "Order is not in accepted or in-progress status" });
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "COMPLETED" },
        include: { buyer: true, seller: true, service: true },
      });

      // Send order completed notifications
      const notificationParams = {
        buyerEmail: updatedOrder.buyer.email,
        buyerName: updatedOrder.buyer.name,
        buyerPhone: updatedOrder.buyer.phone,
        sellerName: updatedOrder.seller.name,
        serviceTitle: updatedOrder.service.title,
        orderId: updatedOrder.id,
        bookingDate: updatedOrder.bookingDate,
      };

      // Email notification
      console.log(
        `ServiceSoko: Attempting order completed email notification for order ${updatedOrder.id}`
      );
      try {
        const emailResult = await notifyOrderCompleted(notificationParams);
        console.log(
          `ServiceSoko: Order completed email notification for order ${updatedOrder.id}:`,
          emailResult
        );
        if (!emailResult.success) {
          console.error(
            `ServiceSoko: Failed to send order completed email notification to ${notificationParams.buyerEmail}:`,
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error(
          `ServiceSoko: Error sending order completed email notification for order ${updatedOrder.id}:`,
          emailError.message,
          emailError.stack
        );
      }

      // SMS notification
      console.log(
        `ServiceSoko: Attempting order completed SMS notification for order ${updatedOrder.id}`
      );
      try {
        const smsResult = await notifyOrderCompletedSMS(notificationParams);
        console.log(
          `ServiceSoko: Order completed SMS notification for order ${updatedOrder.id}:`,
          smsResult
        );
        if (!smsResult.success) {
          console.error(
            `ServiceSoko: Failed to send order completed SMS notification to ${notificationParams.buyerPhone}:`,
            smsResult.error
          );
        }
      } catch (smsError) {
        console.error(
          `ServiceSoko: Error sending order completed SMS notification for order ${updatedOrder.id}:`,
          smsError.message,
          smsError.stack
        );
      }

      res.json({
        message: "Order completed successfully",
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
        },
      });
    } catch (error) {
      console.error("Order complete error:", error);
      res.status(500).json({
        error: "Failed to complete order",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Cancel an order
router.put(
  "/orders/:id/cancel",
  authenticateToken,
  orderLimiter,
  async (req, res) => {
    const { id } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { buyer: true, seller: true, service: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.buyerId !== req.user.id) {
        return res
          .status(403)
          .json({ error: "Only the buyer can cancel this order" });
      }

      if (!["PENDING", "ACCEPTED", "IN_PROGRESS"].includes(order.status)) {
        return res
          .status(400)
          .json({ error: "Order cannot be canceled in this status" });
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: "CANCELLED" },
        include: { buyer: true, seller: true, service: true },
      });

      // Send order cancelled notifications
      const notificationParams = {
        sellerEmail: updatedOrder.seller.email,
        sellerName: updatedOrder.seller.name,
        sellerPhone: updatedOrder.seller.phone,
        buyerName: updatedOrder.buyer.name,
        serviceTitle: updatedOrder.service.title,
        orderId: updatedOrder.id,
        bookingDate: updatedOrder.bookingDate,
      };

      // Email notification
      console.log(
        `ServiceSoko: Attempting order cancelled email notification for order ${updatedOrder.id}`
      );
      try {
        const emailResult = await notifyOrderCancelled(notificationParams);
        console.log(
          `ServiceSoko: Order cancelled email notification for order ${updatedOrder.id}:`,
          emailResult
        );
        if (!emailResult.success) {
          console.error(
            `ServiceSoko: Failed to send order cancelled email notification to ${notificationParams.sellerEmail}:`,
            emailResult.error
          );
        }
      } catch (emailError) {
        console.error(
          `ServiceSoko: Error sending order cancelled email notification for order ${updatedOrder.id}:`,
          emailError.message,
          emailError.stack
        );
      }

      // SMS notification
      console.log(
        `ServiceSoko: Attempting order cancelled SMS notification for order ${updatedOrder.id}`
      );
      try {
        const smsResult = await notifyOrderCancelledSMS(notificationParams);
        console.log(
          `ServiceSoko: Order cancelled SMS notification for order ${updatedOrder.id}:`,
          smsResult
        );
        if (!smsResult.success) {
          console.error(
            `ServiceSoko: Failed to send order cancelled SMS notification to ${notificationParams.sellerPhone}:`,
            smsResult.error
          );
        }
      } catch (smsError) {
        console.error(
          `ServiceSoko: Error sending order cancelled SMS notification for order ${updatedOrder.id}:`,
          smsError.message,
          smsError.stack
        );
      }

      res.json({
        message: "Order cancelled successfully",
        order: {
          id: updatedOrder.id,
          status: updatedOrder.status,
        },
      });
    } catch (error) {
      console.error("Order cancel error:", error);
      res.status(500).json({
        error: "Failed to cancel order",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Get user orders (as buyer or seller)
router.get("/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [{ buyerId: req.user.id }, { sellerId: req.user.id }],
      },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      serviceId: order.serviceId, // Include serviceId
      serviceTitle: order.service.title,
      buyerName: order.buyer.name,
      sellerName: order.seller.name,
      sellerId: order.sellerId, // Include sellerId for chat
      bookingDate: order.bookingDate,
      createdAt: order.createdAt,
      status: order.status,
      role: order.buyerId === req.user.id ? "BUYER" : "SELLER",
    }));

    res.json({
      message: "Your orders",
      orders: formattedOrders,
    });
  } catch (error) {
    console.error("Order fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch orders",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get seller orders (new and history)
router.get("/seller-orders", authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const newOrders = await prisma.order.findMany({
      where: {
        sellerId: req.user.id,
        status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] },
      },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    const orderHistory = await prisma.order.findMany({
      where: {
        sellerId: req.user.id,
        status: { in: ["COMPLETED", "REJECTED", "CANCELLED"] },
      },
      include: {
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
    });

    const newOrdersCount = await prisma.order.count({
      where: {
        sellerId: req.user.id,
        status: { in: ["PENDING", "ACCEPTED", "IN_PROGRESS"] },
      },
    });

    const formattedNewOrders = newOrders.map((order) => ({
      id: order.id,
      serviceId: order.serviceId, // Include serviceId
      serviceTitle: order.service.title,
      buyerName: order.buyer.name,
      sellerName: order.seller.name,
      sellerId: order.sellerId, // Include sellerId for chat
      bookingDate: order.bookingDate,
      createdAt: order.createdAt,
      status: order.status,
    }));

    const formattedOrderHistory = orderHistory.map((order) => ({
      id: order.id,
      serviceId: order.serviceId, // Include serviceId
      serviceTitle: order.service.title,
      buyerName: order.buyer.name,
      sellerName: order.seller.name,
      sellerId: order.sellerId, // Include sellerId for chat
      bookingDate: order.bookingDate,
      createdAt: order.createdAt,
      status: order.status,
    }));

    res.json({
      message: "Seller orders",
      newOrders: formattedNewOrders,
      orderHistory: formattedOrderHistory,
      newOrdersCount,
    });
  } catch (error) {
    console.error("Seller orders fetch error:", error);
    res.status(500).json({
      error: "Failed to fetch seller orders",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;