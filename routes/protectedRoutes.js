const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/dashboard", authMiddleware, (req, res) => {
  // req.user me JWT se mila data available hai (id, role)
  res.json({
    message: `Welcome to your dashboard, user ID: ${req.user.id}`,
    role: req.user.role,
  });
});

module.exports = router;
