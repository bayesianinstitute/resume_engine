import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import NodeCache from "node-cache";
import { errorMiddleware } from "./middleware/error.js";
import { connectDB } from "./utils/features.js";
import userRouter from "./routes/user.js";
import resumeRouter from "./routes/resume.js";
import jobRouter from "./routes/jobRoutes.js";
import { initSocket } from "./socket.js";
import http from "http";
import path from "path";

dotenv.config(); // Load environment variables

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Environment variables (define these before using them)
const port = process.env.PORT || 5000;
const host = process.env.HOST || "127.0.0.1";
const mongoDBUrl = process.env.MONGODB_URL;
initSocket(server); // Initialize WebSocket
// Middleware setup
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({ origin: true, credentials: true }));

// Static files
app.use("/uploads", express.static(path.resolve("uploads")));

// Initialize cache
export const myCache = new NodeCache();

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/resume", resumeRouter);
app.use("/api/v1/job", jobRouter);

// Error middleware
app.use(errorMiddleware);

// Start server and connect to MongoDB
server.listen(port, async () => {  // Ensure 'server.listen' uses the defined 'port'
  if (!mongoDBUrl) {
    console.error("MongoDB URL is not provided in the environment variables.");
    process.exit(1); // Exit with failure
  }

  try {
    await connectDB(mongoDBUrl);
    console.log(`Connected to MongoDB at ${mongoDBUrl}`);
    console.log(`Server is running on http://${host}:${port}`);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit with failure
  }
});
