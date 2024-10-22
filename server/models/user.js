import mongoose, { Schema } from "mongoose";

// PendingUser Schema
const pendingUserSchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId().toHexString(),
  },
  email: { type: String, required: true, unique: true },
  verificationToken: { type: String, required: true, unique: true },
});


const actualUserSchema = new Schema({
  email: { type: String, required: [true, "Please Enter Email"], unique: true },
  password: { type: String, required: [true, "Please Enter Password"] },
  firstname: { type: String, required: [true, "Please enter First Name"] },
  lastname: { type: String, required: [true, "Please enter Last Name"] },
  phone: { type: String, default: "" },
  keywords: { type: [String], default: [] },  // New field to store user preference of videos
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


const ContactSchema = new mongoose.Schema({
  name: {
      type: String,
      required: [true, "Please Enter Name"]
  },
  email: {
      type: String,
      required: [true, "Please Enter Email"]
  },
  message: {
      type: String,
      required: [true, "Please Enter Message"]
  }
}, {
  timestamps: true 
});

export const Contact = mongoose.model("Contact", ContactSchema);

export const User = mongoose.model("User", actualUserSchema);

export const PendingUser = mongoose.model("PendingUser", pendingUserSchema);
