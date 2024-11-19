import { EnterpriseUser } from "../models/enterprise.js"; // Adjust path
import ErrorHandler from "../utils/utitlity.js";

export const verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["api-key"]; // Get API key from headers

    if (!apiKey) {
      return next(new ErrorHandler("API Key is missing", 401)); // Unauthorized
    }

    // Check if the API key exists in the database
    const user = await EnterpriseUser.findOne({ apiKey });
    if (!user) {
      return next(new ErrorHandler("Invalid API Key", 401)); // Unauthorized
    }

    req.user = user; // Attach the user to the request for further use
    next(); // API key is valid, proceed to the next middleware/controller
  } catch (error) {
    return next(new ErrorHandler("An error occurred while validating API Key", 500)); // Internal Server Error
  }
};
