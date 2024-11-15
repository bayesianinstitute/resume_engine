import mongoose, { Schema } from "mongoose";

// PendingUser Schema
const pendingUserSchema = new Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId().toHexString(),
  },
  email: { type: String, required: true, unique: true },
  password: { type: String},
  verificationToken: String,
});


const actualUserSchema = new Schema({
  email: { type: String, required: [true, "Please Enter Email"], unique: true },
  password: { type: String, required: [true, "Please Enter Password"] },
  name: { type: String, required: [true, "Please enter First Name"] },
  phone: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});


export const User = mongoose.model("User", actualUserSchema);

export const PendingUser = mongoose.model("PendingUser", pendingUserSchema);
