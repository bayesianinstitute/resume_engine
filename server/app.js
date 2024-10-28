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

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Environment variables
const port = process.env.PORT || 5000;
const host = process.env.HOST || "127.0.0.1";
const mongoDBUrl = process.env.MONGODB_URL;

// Middleware setup
app.use(express.json());
app.use(morgan("dev"));
app.use(cors({ origin: true, credentials: true }));

// Static files
app.use("/uploads", express.static("uploads"));

// Initialize cache
export const myCache = new NodeCache();

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/resume", resumeRouter);
app.use("/api/v1/job", jobRouter);
// Error middleware
app.use(errorMiddleware);

// Start server and connect to MongoDB
app.listen(port, host, async () => {
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
