// Imports
const { URL } = require("url");
const User = require("../models/userModel");
const rateLimit = require("express-rate-limit");
exports.handleRateLimit = (max) => rateLimit({
  windowMs: 15 * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    const error = new Error("Too many requests!");
    error.status = 429;
    next(error);
  },
});
// GET , POST , PUT , DELETE APIs Authentication;
exports.auth = (type = "api") => async (req, res, next) => {
  const userId = req.session.user?.userId;
  const reject = () => {
    if (type === "page") {
      req.session.redirectTo = req.originalUrl;
      return res.redirect("/auth/login?redirected=1");
    }
    try {
      const ref = new URL(req.get("Referer") || "");
      if (ref.host === req.get("host"))
      req.session.redirectTo = ref.pathname + ref.search;
    } catch (_) {}
    return res.status(401).json({
      type: "error",
      message: "User not logged in!",
      redirect: "/auth/login?redirected=1",
    });
  };
  if (!userId) return reject();
  try {
    const user = await User.findById(userId).select("+sessionVersion");
    if (!user || user.sessionVersion !== req.session.sessionVersion) {
      return req.session.regenerate((error) => {
        if (error) return next(error);
        return reject();
      });
    }
    const requestedUsername = req.params?.username;
    if (requestedUsername && requestedUsername !== user.username) {
      return res.status(403).json({
        type: "error",
        message: "Access denied!",
      });
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.admin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      type: "error",
      message: "Access denied!",
    });
  }
  return next();
};
exports.requirePending2FA = (req, res, next) => {
  const { pendingUser, otpHash, otpExpires } = req.session;
  if (!pendingUser || !otpHash || !otpExpires || Date.now() > otpExpires) {
    return res.status(401).json({
      type: "error",
      message: "Your verification session has expired. Please log in again.",
      redirect: "/auth/login",
    });
  }
  next();
};
exports.regenerateSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
});
exports.saveSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
});
