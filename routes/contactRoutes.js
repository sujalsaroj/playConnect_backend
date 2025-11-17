const express = require("express");
const router = express.Router();
const ContactUs = require("../models/contactUs"); // import model

// POST route
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const newContact = new ContactUs({ name, email, message });
    await newContact.save();

    res
      .status(201)
      .json({ success: true, message: "Message saved successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
