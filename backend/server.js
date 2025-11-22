import express from "express";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profileRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import blogRoutes from './routes/blogRoutes.js'
import messageRoutes from "./routes/messageRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import uploadRoutes from "./routes/uploads.js";
import cors from "cors";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

// Security Middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  })
);
const allowedOrigins = [
  "https://servicesoko.co.ke",
  "https://www.servicesoko.co.ke",
  "http://localhost:5173" // for local testing
];
app.use(
  cors({
    origin: allowedOrigins, // Reflect the request origin (safer than "*")
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow more requests in dev
  skip: (req) => req.ip === "::1" || req.ip === "127.0.0.1", // Skip for localhost
});
app.use(limiter);

// Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body Parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Authentication
app.use(passport.initialize());

// Static Files
app.use(
  "/Uploads",
  express.static(path.join(__dirname, "Uploads"), {
    setHeaders: (res, filePath) => {
     
      console.log(`Serving static file: ${filePath}`);
    },
  })
);

// API Routes
app.use("/auth", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", serviceRoutes);
app.use("/api", orderRoutes);
app.use("/api", reviewRoutes);
app.use("/api", messageRoutes);
app.use("/api", contactRoutes);
app.use("/api", blogRoutes);

app.use("/api", uploadRoutes);


// Health Checks
const healthChecks = {
  server: true,
  database: false,
  timestamp: new Date().toISOString(),
};

app.get("/ping", (req, res) => res.send("pong"));

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthChecks.database = true;
    res.json({
      ...healthChecks,
      uptime: process.uptime(),
      memory: process.memoryUsage().rss / (1024 * 1024) + " MB",
      database: {
        provider: process.env.DATABASE_URL?.split(":")[0] || "unknown",
        status: "connected",
      },
    });
  } catch (error) {
    healthChecks.database = false;
    res.status(503).json({
      ...healthChecks,
      error: "Database connection failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// API Documentation
app.get("/", (req, res) => {
  res.json({
    app: "ServiceSoko",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    documentation: process.env.API_DOCS_URL || "Coming soon",
    endpoints: {
      auth: "/auth",
      api: "/api",
      health: "/health",
    },
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Server Initialization
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server ready at http://localhost:${PORT}`);
  console.log(`📊 Health checks: http://localhost:${PORT}/health`);
  console.log(`⏱️ Started at: ${new Date().toLocaleString()}\n`);
});

// Graceful Shutdown
const shutdown = async () => {
  console.log("\n🔴 Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    console.log("✅ Prisma client disconnected");
    server.close(() => {
      console.log("🛑 Server terminated");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Shutdown error:", error);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);