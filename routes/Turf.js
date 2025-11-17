const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  addTurf,
  getOwnerTurfs,
  deleteTurf,
  updateTurf,
  getAllTurfs,
} = require("../controllers/turfController");

const Turf = require("../models/Turf");
const bookingController = require("../controllers/bookingcontroller");
const { protect, ownerOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Ensure uploads dir exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});
const upload = multer({ storage });

// ====== Turf Routes ======

// Add new turf (owner only)
router.post("/add", protect, ownerOnly, upload.array("photos", 5), addTurf);

// Get all turfs of logged-in owner
router.get("/my-turfs", protect, ownerOnly, getOwnerTurfs);

// Update turf (owner only)
router.put("/:id", protect, ownerOnly, upload.array("photos", 5), updateTurf);

// Delete turf (owner only)
router.delete("/:id", protect, ownerOnly, deleteTurf);

// ✅ Extra APIs for dependent dropdowns
router.get("/states", async (req, res) => {
  try {
    const states = await Turf.distinct("state");
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/cities/:state", async (req, res) => {
  try {
    const cities = await Turf.distinct("city", { state: req.params.state });
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all turfs (public)
router.get("/", getAllTurfs);

// ✅ Get single turf by ID (with owner details populated)
router.get("/:id", async (req, res) => {
  try {
    // ✅ Populate owner data (name, email, phone, address, profilePic)
    const turf = await Turf.findById(req.params.id).populate(
      "owner",
      "name email phone address profilePic"
    );

    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    res.json(turf);
  } catch (err) {
    console.error("Error fetching turf:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get user bookings (user must be logged in)
router.get("/bookings", protect, bookingController.getMyBookings);

module.exports = router;
