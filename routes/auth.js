const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  uploadProfilePic,
  forgotPassword,
  resetPassword,
  verifyEmail, //  multer middleware
} = require("../controllers/controller");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify/:token", verifyEmail);
// Private routes
router.get("/me", protect, getMe);

// PUT route with multer middleware
router.put("/update", protect, uploadProfilePic, updateProfile);

module.exports = router;
