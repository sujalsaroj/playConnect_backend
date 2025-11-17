const Booking = require("../models/booking");
const Turf = require("../models/Turf");

// Book Turf
exports.bookTurf = async (req, res) => {
  try {
    const { turfId, date, slot, userName, userEmail, userPhone } = req.body;
    const userId = req.user._id || req.user.id; // ✅ fixed here

    // Validation
    if (!turfId || !date || !slot || !userName || !userEmail || !userPhone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    const slotObj = turf.slots.find((s) => s.time === String(slot).trim());
    if (!slotObj) return res.status(404).json({ message: "Slot not found" });
    if (slotObj.booked)
      return res.status(400).json({ message: "Slot already booked" });

    slotObj.booked = true;
    await turf.save();

    const booking = new Booking({
      turfId,
      userId,
      userName,
      userEmail,
      userPhone,
      date,
      slot: String(slot).trim(),
      status: "Pending",
    });

    await booking.save();

    res.json({
      message: "Booking successful. Proceed to payment.",
      booking,
    });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ message: "Error booking turf" });
  }
};

// ✅ FIXED getMyBookings
exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; // ✅ fixed here
    const bookings = await Booking.find({ userId }).populate("turfId");
    res.json(bookings);
  } catch (error) {
    console.error("Get Bookings Error:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
};

// Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const turf = await Turf.findById(booking.turfId);
    if (turf) {
      const slotObj = turf.slots.find((s) => s.time === booking.slot);
      if (slotObj) {
        slotObj.booked = false;
        await turf.save();
      }
    }

    booking.status = "Cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel Booking Error:", error);
    res.status(500).json({ message: "Error cancelling booking" });
  }
};

// Get Bookings for Turf Owner
exports.getBookingsForOwner = async (req, res) => {
  try {
    const turfs = await Turf.find({ owner: req.user.id });
    const turfIds = turfs.map((t) => t._id);

    const bookings = await Booking.find({
      turfId: { $in: turfIds },
      status: { $in: ["Pending", "Confirmed"] },
    })
      .populate("turfId userId")
      .lean(); // 👈 Plain JS object me convert

    // 👇 Add this small logic to make sure user info is included
    const updatedBookings = bookings.map((b) => ({
      ...b,
      userName: b.userName || b.userId?.name || "N/A",
      userEmail: b.userEmail || b.userId?.email || "N/A",
      userPhone: b.userPhone || b.userId?.phone || "N/A",
    }));

    res.json(updatedBookings);
  } catch (err) {
    console.error("Get Owner Bookings Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Confirm Booking (by Turf Owner)
exports.confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const turf = await Turf.findById(booking.turfId);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    if (!turf.owner || turf.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "Confirmed";
    await booking.save();

    res.json({ message: "Booking confirmed successfully", booking });
  } catch (err) {
    console.error("Confirm Booking Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Booking After Payment
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "Paid";
    await booking.save();

    res.json({ message: "Payment successful, booking completed", booking });
  } catch (err) {
    console.error("Payment Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
