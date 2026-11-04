import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";

import connectDB from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import organisationRoutes from "./routes/organisation.routes.js";
import userManagementRoutes from "./routes/userManagement.routes.js";
import errorHandler from "./middleware/error.middleware.js";

// Prevent unhandled errors from terminating nodemon
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught Exception:", err);
});

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(",").map(url => url.trim().replace(/\/$/, "")) 
  : ["http://localhost:5173","https://databasemanagement-theta.vercel.app"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "connecting",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1/auth",          authRoutes);
app.use("/api/v1/organisations", organisationRoutes);
app.use("/api/v1/users",         userManagementRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});
app.use(errorHandler);

const startServer = async () => {
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
      console.error(`👉 Close the process currently using port ${PORT} or run on another port.`);
    } else {
      console.error("Server listener error:", err);
    }
  });

  connectDB().catch((err) => {
    console.error("connectDB error:", err.message);
  });
};

startServer();
