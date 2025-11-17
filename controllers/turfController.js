const Turf = require("../models/Turf");

// helpers
const normalizeSports = (sports) => {
  if (Array.isArray(sports))
    return sports.map((s) => String(s).trim()).filter(Boolean);
  if (typeof sports === "string")
    return sports
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

// 🔥 Universal normalizeSlots: handle string, array, object
const normalizeSlots = (slotsRaw) => {
  let slotsArray = [];

  if (Array.isArray(slotsRaw)) {
    slotsArray = slotsRaw;
  } else if (typeof slotsRaw === "string") {
    try {
      const parsed = JSON.parse(slotsRaw);
      if (Array.isArray(parsed)) slotsArray = parsed;
      else slotsArray = [slotsRaw];
    } catch {
      slotsArray = [slotsRaw];
    }
  } else if (typeof slotsRaw === "object" && slotsRaw !== null) {
    slotsArray = [slotsRaw];
  }

  return slotsArray
    .map((s) => {
      if (typeof s === "object" && s.time) {
        return { time: String(s.time).trim(), booked: !!s.booked };
      }
      return { time: String(s).trim(), booked: false };
    })
    .filter((s) => s.time);
};

// Add Turf
const addTurf = async (req, res) => {
  try {
    const { name, sports, price, location, state, city } = req.body;
    if (!name || !price || !location || !state || !city)
      return res
        .status(400)
        .json({ error: "name, price, location, state, city required" });

    const sportsArr = normalizeSports(sports);
    const slots = normalizeSlots(req.body.slots);
    const photos = Array.isArray(req.files)
      ? req.files.map((f) => f.filename)
      : [];

    const turf = new Turf({
      owner: req.user.id,
      name,
      sports: sportsArr,
      price: Number(price),
      slots,
      photos,
      location,
      state: state.trim(),
      city: city.trim(),
    });

    await turf.save();
    res.status(201).json({ message: "Turf added successfully", turf });
  } catch (err) {
    console.error("Add Turf Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update Turf
const updateTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ error: "Turf not found" });

    if (String(turf.owner) !== req.user.id)
      return res
        .status(403)
        .json({ error: "Not authorized to edit this turf" });

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.location !== undefined) updates.location = req.body.location;
    if (req.body.state !== undefined) updates.state = req.body.state.trim();
    if (req.body.city !== undefined) updates.city = req.body.city.trim();
    if (req.body.sports !== undefined)
      updates.sports = normalizeSports(req.body.sports);
    if (req.body.slots !== undefined)
      updates.slots = normalizeSlots(req.body.slots);

    if (req.files && req.files.length > 0)
      updates.photos = req.files.map((f) => f.filename);

    Object.assign(turf, updates);
    await turf.save();

    res.json({ message: "Turf updated successfully", turf });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all turfs for owner
const getOwnerTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({ owner: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(turfs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all turfs
const getAllTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find();
    res.json(turfs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching turfs" });
  }
};

// Delete Turf
const deleteTurf = async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) return res.status(404).json({ error: "Turf not found" });

    if (String(turf.owner) !== req.user.id)
      return res
        .status(403)
        .json({ error: "Not authorized to delete this turf" });

    await turf.deleteOne();
    res.json({ message: "Turf deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  addTurf,
  updateTurf,
  deleteTurf,
  getOwnerTurfs,
  getAllTurfs,
};