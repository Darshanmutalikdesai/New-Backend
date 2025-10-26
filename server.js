import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import userRoutes from "./src/routes/userRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import paperPresentationRoutes from "./src/routes/paperPresentationRoutes.js";
import mongoose from "mongoose";

dotenv.config();

// ✅ Connect MongoDB
connectDB();

const app = express();

// ✅ Middleware
app.use(express.json()); // JSON parsing

// ✅ Manual CORS headers (no 'cors' package needed)
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://avalanche.git.edu" // <-- replace with your deployed frontend URL
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ✅ API Routes
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/paper-presentation", paperPresentationRoutes);

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("🚀 Avalanche Backend is running successfully!");
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong on the server",
    error: err.message,
  });
});

// ✅ MongoDB Cleanup Script
const runMongoCleanup = async () => {
  if (process.env.RUN_ONCE === "true") {
    try {
      const db = mongoose.connection.db;

      try {
        await db.collection("events").dropIndex("event_id_1");
        console.log("✅ Old event_id index dropped");
      } catch {
        console.log("ℹ️ No old event_id index found, skipping drop");
      }

      const deleteResult = await db.collection("events").deleteMany({ event_id: null });
      console.log(`✅ Removed ${deleteResult.deletedCount} old documents with null event_id`);

      await db.collection("events").createIndex({ eventCode: 1 }, { unique: true });
      console.log("✅ Unique index on eventCode ensured");
    } catch (error) {
      console.error("❌ MongoDB cleanup error:", error);
    }
  }
};

// Run cleanup if RUN_ONCE=true
runMongoCleanup();

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
