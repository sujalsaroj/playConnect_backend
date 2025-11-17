const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["player", "owner", "admin"],
      default: "player",
    },

    // Extra profile fields
    phone: { type: String },
    address: { type: String },
    dob: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    profilePic: { type: String },
    isProfileComplete: { type: Boolean, default: false },

    //  Add these fields for password reset abd registration verification
    resetToken: { type: String },
    resetTokenExpire: { type: Date },
    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String },
    verifyTokenExpire: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
