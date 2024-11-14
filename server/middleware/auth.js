import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/utitlity.js";
import { TryCatch } from "./error.js";
import dotenv from "dotenv";
import { User } from "../models/user.js";
dotenv.config();
// Secret key for JWT signing
const secretKey = process.env.SECRET_KEY || "JWT_KEY";
export const generateToken = ({ userId, email }) => {
  const payload = { userId, email };
  console.log(secretKey);
  return jwt.sign(payload, secretKey, { expiresIn: "1h" });
};
// Middleware to verify JWT token
export const verifyTokenMiddleware = TryCatch(async (req, res, next) => {
  const userId = req.body.userId;
  if (userId) {
    // Find user by ID in the database
    const user = await User.findById(userId);
    // If user not found, throw an error
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("No Authorization header found");
    return next(new ErrorHandler("Not authorized", 401));
  }

  const token = req.headers.authorization?.split(" ")[1];


  if (!token) {
    return next(new ErrorHandler("No token provided.", 401));
  }
  // Verify the token
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return next(new ErrorHandler("Token expired.", 401));
      }
      return next(new ErrorHandler("Failed to authenticate token.", 401));
    }
    const { userId } = decoded;
    // Attach userID to the request object
    req.body.userId = userId;
    console.log(userId);
    next();
  });
});
const adminOnly = TryCatch(async (req, res, next) => {
  const { key } = req.body;
  if (key != "admin")
    return next(
      new ErrorHandler("You are not authorized to access this route", 401)
    );
  next();
});
export const userId = TryCatch(async (req, res, next) => {
  const email = "faizackpr@gmail.com";
  const { key } = req.body;
  next();
});
export default adminOnly;
