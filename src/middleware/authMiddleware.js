const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthenticatedError("Authentication invalid"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Invalid token:", err);
    return next(new UnauthenticatedError("Invalid or expired token"));
  }
};

module.exports = authMiddleware;
