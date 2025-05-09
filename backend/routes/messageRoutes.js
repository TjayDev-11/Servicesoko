import express from "express";
import { PrismaClient } from "@prisma/client";
import authenticateToken from "../middleware/authMiddleware.js";
import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator";
import { notifyMessageReceived } from "../utils/notify.js";

const { window } = new JSDOM("");
const DOMPurify = createDOMPurify(window);

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting
const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each user to 50 messages per window
  keyGenerator: (req) => req.user.id,
});

// Message validation
const validateMessage = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message must be between 1-1000 characters"),
  body("receiverId")
    .isString()
    .notEmpty()
    .withMessage("Valid receiver ID required"),
];

// Send message
router.post(
  "/messages",
  authenticateToken,
  messageLimiter,
  validateMessage,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg,
        code: "VALIDATION_ERROR",
      });
    }

    const { receiverId, content } = req.body;

    try {
      // Verify sender exists
      const sender = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, role: true },
      });

      if (!sender) {
        return res.status(404).json({
          error: "Sender not found",
          code: "SENDER_NOT_FOUND",
        });
      }

      // Verify receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, role: true, name: true, email: true },
      });

      if (!receiver) {
        return res.status(404).json({
          error: "Receiver not found",
          code: "RECEIVER_NOT_FOUND",
        });
      }

      // Prevent sending message to self
      if (req.user.id === receiverId) {
        return res.status(400).json({
          error: "Cannot send message to yourself",
          code: "SELF_MESSAGE_NOT_ALLOWED",
        });
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          senderId: req.user.id,
          receiverId,
          content: DOMPurify.sanitize(content.trim()),
          isRead: false,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          isRead: true,
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true, email: true } },
        },
      });

      // Send message notification to receiver
      if (message.receiver.email) {
        try {
          const notificationResult = await notifyMessageReceived({
            receiverEmail: message.receiver.email,
            receiverName: message.receiver.name,
            senderName: message.sender.name,
            messageContent: message.content,
            messageId: message.id,
          });
          if (!notificationResult.success) {
            console.error(
              `ServiceSoko: Failed to notify receiver ${receiverId} for message ${message.id}:`,
              notificationResult.error
            );
          }
        } catch (notificationError) {
          console.error(
            `ServiceSoko: Notification error for message ${message.id}:`,
            notificationError.message
          );
        }
      }

      res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error("Send message error:", {
        message: error.message,
        stack: error.stack,
        userId: req.user.id,
        receiverId,
        contentLength: content?.length,
        prismaCode: error.code || "N/A",
      });
      if (error.name === "PrismaClientKnownRequestError") {
        return res.status(500).json({
          error: "Database error creating message",
          code: "DATABASE_ERROR",
          prismaCode: error.code,
        });
      }
      res.status(500).json({
        error: "Failed to send message",
        code: "MESSAGE_SEND_FAILED",
      });
    }
  }
);

// Get messages
router.get(
  "/messages/:receiverId",
  authenticateToken,
  [
    param("receiverId")
      .isString()
      .notEmpty()
      .withMessage("Valid receiver ID required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg,
        code: "VALIDATION_ERROR",
      });
    }

    try {
      const { receiverId } = req.params;

      await prisma.message.updateMany({
        where: {
          senderId: receiverId,
          receiverId: req.user.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: req.user.id, receiverId },
            { senderId: receiverId, receiverId: req.user.id },
          ],
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          isRead: true,
          createdAt: true,
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
        },
      });

      res.json({
        success: true,
        messages: messages || [],
      });
    } catch (error) {
      console.error("Get messages error:", {
        message: error.message,
        stack: error.stack,
        userId: req.user.id,
        receiverId: req.params.receiverId,
        prismaCode: error.code || "N/A",
      });
      res.status(500).json({
        error: "Failed to retrieve messages",
        code: "MESSAGE_RETRIEVAL_FAILED",
      });
    }
  }
);

// Get conversations
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: req.user.id }, { receiverId: req.user.id }],
      },
      select: {
        senderId: true,
        receiverId: true,
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        isRead: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      distinct: ["senderId", "receiverId"],
      take: parseInt(limit),
    });

    const conversations = [];
    const seenPairs = new Set();

    for (const msg of messages) {
      const otherUserId =
        msg.senderId === req.user.id ? msg.receiverId : msg.senderId;
      const pairKey = [req.user.id, otherUserId].sort().join("-");

      if (!seenPairs.has(pairKey)) {
        seenPairs.add(pairKey);
        const unreadCount = await prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: req.user.id,
            isRead: false,
          },
        });
        conversations.push({
          id: otherUserId,
          name: DOMPurify.sanitize(
            msg.senderId === req.user.id ? msg.receiver.name : msg.sender.name
          ),
          unreadCount,
        });
      }
    }

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", {
      message: error.message,
      stack: error.stack,
      userId: req.user.id,
      prismaCode: error.code || "N/A",
    });
    res.status(500).json({
      error: "Failed to fetch conversations",
      code: "CONVERSATIONS_FAILED",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
