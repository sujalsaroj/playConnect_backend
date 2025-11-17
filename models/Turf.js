const mongoose = require("mongoose");

const turfSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    sports: { type: [String], required: true },
    price: { type: Number, required: true },
    slots: [
      {
        time: { type: String, required: true },
        booked: { type: Boolean, default: false },
      },
    ],
    photos: { type: [String], default: [] },

    // ✅ Added fields
    state: { type: String, required: true },
    city: { type: String, required: true },

    location: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Turf", turfSchema);
