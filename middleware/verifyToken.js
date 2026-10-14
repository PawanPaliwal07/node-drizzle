const jwt = require("jsonwebtoken");

module.exports = function verifyToken(req, res, next) {
  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null;
  const token = req.cookies?.token || bearer;
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};