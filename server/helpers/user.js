import { resume_matchschema } from "../models/gemini";
import { User } from "../models/user";

// Helper function: Get user by email
export const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};



