const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { roleCheck } = require("../middleware/roleMiddleware");

const router = express.Router();

// Player dashboard
router.get(
  "/dashboard-player",
  protect,
  roleCheck("player", "admin"),
  (req, res) => {
    res.json({
      message: `Welcome Player ${req.user.id}`,
      role: req.user.role,
    });
  }
);

// Owner dashboard
router.get(
  "/dashboard-turf-owner",
  protect,
  roleCheck("owner", "admin"),
  (req, res) => {
    res.json({
      message: `Welcome Owner ${req.user.id}`,
      role: req.user.role,
    });
  }
);

module.exports = router;

