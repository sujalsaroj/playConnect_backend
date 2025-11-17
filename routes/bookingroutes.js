// routes/bookingroutes.js
const express = require("express");
const router = express.Router();

const {
  bookTurf,
  getMyBookings,
  cancelBooking,
  confirmBooking,
  getBookingsForOwner,
} = require("../controllers/bookingcontroller");

// Yahan destructure karke sirf protect middleware le rahe hain
const { protect } = require("../middleware/authMiddleware");

router.post("/book", protect, bookTurf);
router.get("/my-bookings", protect, getMyBookings);
router.delete("/cancel/:id", protect, cancelBooking);
router.post("/confirm/:id", protect, confirmBooking);
router.get("/owner-bookings", protect, getBookingsForOwner);

module.exports = router;
