const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ✅ Generate Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "2h",
  });
};

// ✅ Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });
exports.uploadProfilePic = upload.single("profilePic");

// Register new user
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 1 day

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      verifyToken,
      verifyTokenExpire,
    });

    await newUser.save();

    // Send verification email in background (non-blocking)
    const verifyLink = `https://playconnect-backend.onrender.com/api/verify/${verifyToken}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    transporter
      .sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Email - PlayConnect",
        html: `
          <h3>Welcome to PlayConnect, ${name}!</h3>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${verifyLink}" target="_blank">${verifyLink}</a>
          <p>This link will expire in 24 hours.</p>
        `,
      })
      .catch((err) => console.error("Mail Error:", err));

    // Respond immediately without waiting for email
    res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect(
        "https://play-connect-frontend.vercel.app/verify-email?status=failed"
      );
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpire = undefined;
    await user.save();

    res.redirect(
      "https://play-connect-frontend.vercel.app/login?verified=true"
    );
  } catch (error) {
    res.redirect(
      "https://play-connect-frontend.vercel.app/verify-email?status=failed"
    );
  }
};

//  Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user._id, user.role);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic
          ? `https://playconnect-backend.onrender.com${user.profilePic}`
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Get profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update profile
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    const { name, email, phone, address, dob, gender } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.dob = dob || user.dob;
    user.gender = gender || user.gender;

    if (req.file) {
      user.profilePic = `/uploads/${req.file.filename}`;
    }

    user.isProfileComplete = true;
    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "No user found with this email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetLink = `https://play-connect-frontend.vercel.app/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // ✅ Fix self-signed certificate error
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - Turf Booking System",
      html: `
          <h3>Password Reset Request</h3>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" target="_blank">${resetLink}</a>
          <p>This link will expire in 10 minutes.</p>
        `,
    });

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Check token + expiry
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    return res
      .status(200)
      .json({ message: "Password reset successful. Please login now." });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};
