  // middleware/authMiddleware.js
  const jwt = require("jsonwebtoken");

  const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // attach user info from token
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

  // Role-specific middleware
  const playerOnly = (req, res, next) => {
    if (req.user.role === "player") return next();
    return res.status(403).json({ message: "Player only route" });
  };

  const ownerOnly = (req, res, next) => {
    if (req.user.role === "owner") return next();
    return res.status(403).json({ message: "Owner only route" });
  };

  module.exports = { protect, playerOnly, ownerOnly };
