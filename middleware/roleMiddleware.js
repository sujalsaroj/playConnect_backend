const roleCheck =
  (...allowedRoles) =>
  (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) return next();
    return res
      .status(403)
      .json({ message: "Access denied: insufficient role" });
  };

const isOwner = roleCheck("owner");

module.exports = { roleCheck, isOwner };
