// controllers/paymentController.js
const Stripe = require("stripe");
const Booking = require("../models/booking");
const Turf = require("../models/Turf");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    // ✅ Accept user details correctly
    const { turfId, slot, date, userName, userEmail, userPhone, userDetails } =
      req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User ID not found in token" });
    }

    // Support older frontend payload (userDetails object)
    const name = userName || userDetails?.name;
    const email = userEmail || userDetails?.email;
    const phone = userPhone || userDetails?.phone;

    if (!turfId || !slot || !date || !name || !email || !phone) {
      console.log("❌ Missing fields:", req.body);
      return res.status(400).json({ message: "All fields are required" });
    }

    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    // Create booking entry with Pending status
    const booking = await Booking.create({
      turfId,
      userId,
      userName: name,
      userEmail: email,
      userPhone: phone,
      date,
      slot,
      status: "Pending",
    });

    // Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: turf.name,
              description: `Booking slot: ${slot} on ${date}`,
            },
            unit_amount: turf.price * 100, // in paisa
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/success?bookingId=${booking._id}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/`,
    });

    res.json({ id: session.id, url: session.url, bookingId: booking._id });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
};
