import mongoose, { Schema } from "mongoose";
import crypto from "crypto"; // To generate secure API keys

const actualEnterpriseUserSchema = new Schema({
  email: { type: String, required: [true, "Please Enter Email"], unique: true },
  name: { type: String, required: [true, "Please enter Name"] },
  phone: { type: String, default: "" },
  apiKey: { type: String, unique: true}, // Unique API key for each user
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to generate API key
actualEnterpriseUserSchema.pre("save", function (next) {
    if (!this.apiKey) {
      this.apiKey = crypto.randomBytes(32).toString("hex"); // Generates a secure API key
      console.log("Generated API Key:", this.apiKey); // Debugging line
    }
    next();
  });

export const EnterpriseUser = mongoose.model("EnterpriseUser", actualEnterpriseUserSchema);
