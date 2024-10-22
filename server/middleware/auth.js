import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/utitlity.js";
import { TryCatch } from "./error.js";
import dotenv from "dotenv";
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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return next(new ErrorHandler("No token provided.", 401));
    }
    // Verify the token
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
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
        return next(new ErrorHandler("You are not authorized to access this route", 401));
    next();
});
export const userId = TryCatch(async (req, res, next) => {
    const email = "faizackpr@gmail.com";
    const { key } = req.body;
    next();
});
export default adminOnly;
