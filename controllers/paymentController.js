const Stripe = require("stripe");
const Booking = require("../models/booking");
const Turf = require("../models/Turf");

// ✅ Use env variable safely
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { turfId, slot, date, userDetails } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId)
      return res.status(401).json({ message: "User not authenticated" });
    if (
      !turfId ||
      !slot ||
      !date ||
      !userDetails?.name ||
      !userDetails?.email ||
      !userDetails?.phone
    )
      return res.status(400).json({ message: "All fields are required" });

    const turf = await Turf.findById(turfId);
    if (!turf) return res.status(404).json({ message: "Turf not found" });

    // ✅ Create booking with Pending status
    const booking = await Booking.create({
      turfId,
      userId,
      userName: userDetails.name,
      userEmail: userDetails.email,
      userPhone: userDetails.phone,
      date,
      slot,
      status: "Pending",
    });

    // ✅ Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: turf.name,
              description: `Slot: ${slot} on ${date}`,
            },
            unit_amount: turf.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?bookingId=${booking._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
    });

    res.json({ id: session.id, url: session.url, bookingId: booking._id });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
};
