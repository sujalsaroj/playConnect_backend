const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema({
  turf: { type: String, required: true }, // Turf name or ID
  date: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  maxPlayers: { type: Number, required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["open", "full"], default: "open" },

  // ✅ New fields added
  sport: { type: String, required: true },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, default: "" },
});

module.exports = mongoose.model("Connection", connectionSchema);
