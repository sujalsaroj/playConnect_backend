const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createCheckoutSession,
  confirmBooking,
} = require("../controllers/paymentController");

router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/confirm", protect, confirmBooking);

module.exports = router;
