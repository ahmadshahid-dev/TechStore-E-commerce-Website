/* ***********************************
                Imports
*********************************** */
const { regenerateSession, saveSession } = require("../utils/auth");
const { check, validationResult } = require("express-validator");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const BCRYPT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  crypto.randomBytes(32).toString("hex"),
  BCRYPT_ROUNDS,
);
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
/* ***********************************
Website GET Signup Controller
*********************************** */
const getSignup = (req, res, next) => {
  res.render("auth/signup", {
    currentPage: "Signup",
    isLoggedIn: false,
    user: {},
  });
};
/* ***********************************
Website POST Signup Controller
*********************************** */
const postSignup = [
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required!")
    .bail()
    .matches(/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/)
    .withMessage("Name contains invalid characters!")
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be 3-100 characters long!"),
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required!")
    .bail()
    .isEmail()
    .withMessage("Invalid email!")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false })
    .custom(async (email) => {
      const existingUser = await User.exists({ email });
      if (existingUser) {
        throw new Error(`Email already in use!`);
      }
    }),
  check("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required!")
    .bail()
    .isLength({ min: 3, max: 30 })
    .withMessage("Name must be 3-30 characters long!")
    .bail()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores!")
    .bail()
    .toLowerCase()
    .custom(async (username) => {
      const existingUser = await User.exists({ username });
      if (existingUser) {
        throw new Error(`Username already in use!`);
      }
    }),
  check("password")
    .notEmpty()
    .withMessage("Password is required!")
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("Password must be 12-72 characters long!")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain a lowercase letter!")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter!")
    .bail()
    .matches(/[0-9]/)
    .withMessage("Password must contain a number!")
    .bail()
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/)
    .withMessage("Password must contain a special character!"),
  check("terms")
    .equals("on")
    .withMessage("Terms & conditions acceptance is required!"),
  async (req, res, next) => {
    const { name, email, username, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await User.create({
        name,
        email,
        username,
        password: hashedPassword,
      });
      return res.status(201).json({
        type: "success",
        message: "Account Created!",
        redirect: "/auth/login",
      });
    } catch (error) {
      console.error("Signup error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website GET Login Controller
*********************************** */
const getLogin = (req, res, next) => {
  if (!req.query.redirected) delete req.session.redirectTo;
  res.render("auth/login", {
    currentPage: "Login",
    isLoggedIn: false,
    user: {},
  });
};
/* ***********************************
Website POST Login Controller
*********************************** */
const postLogin = [
  check("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email/Username is required!"),
  check("password")
    .notEmpty()
    .withMessage("Password is required!")
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("Invalid credentials!"),
  async (req, res, next) => {
    const { identifier, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    try {
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      }).select("+password +twoFctrVerification +sessionVersion");
      const passwordMatch = await bcrypt.compare(
        password,
        user?.password || DUMMY_PASSWORD_HASH,
      );
      if (!user || !passwordMatch) {
        return res.status(422).json({
          type: "error",
          errors: [{ path: "identifier", msg: "Invalid credentials!" }],
        });
      }
      const ua = new UAParser(req.headers["user-agent"]).getResult();
      const geo = geoip.lookup(req.ip);
      const rawCity = req.headers["x-vercel-ip-city"];
      const city = rawCity ? decodeURIComponent(rawCity) : geo?.city;
      const country = req.headers["x-vercel-ip-country"] || geo?.country;
      const location = [city, country].filter(Boolean).join(", ") || "Unknown";
      if (user.twoFctrVerification) {
        const otp = crypto.randomInt(100000, 1000000).toString();
        let redirectTo = req.session.redirectTo || "/";
        await regenerateSession(req);
        req.session.pendingUser = {
          userId: user._id.toString(),
          name: user.name,
          username: user.username,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
        req.session.pendingDevice = {
          id: crypto.randomUUID(),
          userAgent: `${ua.os.name || "Unknown"} — ${ua.browser.name || "Unknown"}`,
          ip: req.ip,
          location,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        };
        req.session.pendingRedirectTo = redirectTo;
        req.session.otpHash = crypto
          .createHash("sha256")
          .update(otp)
          .digest("hex");
        req.session.otpExpires = Date.now() + 5 * 60 * 1000;
        await saveSession(req);
        try {
          await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: user.email,
            subject: "Your Two-Factor Authentication Code",
            html: `
              <div style="font-family: Arial, Helvetica, sans-serif; text-align: left; max-width: 600px; padding: 10px 0;">
              <!-- Logo -->
              <div style="color: #0f172a; font-size: 22px; font-family: Arial, Helvetica, sans-serif; font-weight: 800; line-height: 1.5; margin-bottom: 12px;">
              Tech<span style="color: #ea580c;">Store</span>
              </div>
              <!-- Heading -->
              <h2 style="color: #0f172a; font-size: 20px; font-family: Arial, Helvetica, sans-serif; font-weight: 700; margin: 0 0 8px;">
              🔐 Two-Factor Authentication
              </h2>
              <!-- Description -->
              <p style="color: #64748b; font-size: 14px; font-family: Arial, Helvetica, sans-serif; line-height: 1.5; margin: 0 0 18px; max-width: 500px;">
              Use the code below to complete your login for <strong>${user.email}</strong>:
              </p>
              <!-- OTP Code -->
              <div style="display: inline-block; background-color: #fff7ed; color: #ea580c; font-size: 28px; font-family: 'Courier New', monospace; font-weight: 800; letter-spacing: 8px; padding: 12px 20px; border-radius: 12px; line-height: 1.25; border: 1px solid #fed7aa;">
             ${otp}
             </div>
             <!-- Expiry Notice -->
             <p style="color: #8a98ac; font-size: 12px; font-family: Arial, Helvetica, sans-serif; line-height: 1.5; margin: 18px 0 0;">
             ⏱️ This code will expire in <strong style="color: #0f172a;">5 minutes</strong>. Do not share it with anyone.
             </p>
             <p style="color: #8a98ac; font-size: 12px; font-family: Arial, Helvetica, sans-serif; line-height: 1.5; margin: 8px 0 0;">
             If you did not try to log in, please change your password immediately.
             </p>
             </div>
            `,
          });
        } catch (error) {
          console.error("2FA email sending failed:", error);
          delete req.session.pendingUser;
          delete req.session.pendingDevice;
          delete req.session.pendingRedirectTo;
          delete req.session.otpHash;
          delete req.session.otpExpires;
          try {
            await saveSession(req);
          } catch (sessionError) {
            console.error("Session cleanup failed:", sessionError);
            try {
              await new Promise((resolve, reject) => {
                req.session.destroy((error) => {
                  if (error) reject(error);
                  else resolve();
                });
              });
            } catch (destroyError) {
              console.error("Session destruction failed:", destroyError);
            }
          }
          return res.status(503).json({
            type: "error",
            message: "Unable to send verification code. Please try again.",
          });
        }
        return res.status(200).json({
          type: "success",
          F2verification: true,
        });
      }
      let redirectTo = req.session.redirectTo || "/";
      if (redirectTo.startsWith("/@")) {
        redirectTo = redirectTo.replace(/^\/@[^/]+/, `/@${user.username}`);
      }
      delete req.session.redirectTo;
      req.session.regenerate((error) => {
        if (error) return next(error);
        req.session.isLoggedIn = true;
        req.session.user = {
          userId: user._id.toString(),
          name: user.name,
          username: user.username,
          role: user.role,
        };
        req.session.sessionVersion = user.sessionVersion;
        req.session.device = {
          id: crypto.randomUUID(),
          userAgent: `${ua.os.name || "Unknown"} — ${ua.browser.name || "Unknown"}`,
          ip: req.ip,
          location,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        };
        req.session.save((error) => {
          if (error) return next(error);
          return res.status(200).json({
            type: "success",
            message: "Logged In!",
            redirect:
              redirectTo !== "/"
                ? redirectTo
                : user.role === "admin"
                  ? "/admin/dashboard"
                  : "/",
          });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website POST 2 Factor OTP Controller
*********************************** */
const post2fOTPReceived = [
  check("OTPCode")
    .trim()
    .notEmpty()
    .withMessage("OTP is required!")
    .bail()
    .isNumeric()
    .withMessage("OTP must contain digits only!")
    .bail()
    .isLength({ min: 6, max: 6 })
    .withMessage("Invalid OTP!"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const {
      pendingUser,
      pendingDevice,
      pendingRedirectTo,
      otpHash,
      otpExpires,
    } = req.session;
    const { OTPCode } = req.body;
    try {
      if (
        !pendingUser ||
        !pendingDevice ||
        !otpHash ||
        !otpExpires ||
        Date.now() > otpExpires
      ) {
        return res.status(400).json({
          type: "error",
          message: "Invalid or expired OTP!",
        });
      }
      req.session.otpAttempts = (req.session.otpAttempts || 0) + 1;
      if (req.session.otpAttempts > 3) {
        await regenerateSession(req);
        return res.status(429).json({
          type: "error",
          message: "Too many attempts. Please login again.",
        });
      }
      const hashIn = crypto.createHash("sha256").update(OTPCode).digest();
      const hashOut = Buffer.from(otpHash, "hex");
      if (!crypto.timingSafeEqual(hashIn, hashOut)) {
        return res.status(400).json({
          type: "error",
          message: "Invalid or expired OTP!",
        });
      }
      let redirectTo = pendingRedirectTo || "/";
      if (!redirectTo.startsWith("/") || redirectTo.startsWith("//"))
        redirectTo = "/";
      await regenerateSession(req);
      req.session.isLoggedIn = true;
      req.session.user = {
        userId: pendingUser.userId,
        name: pendingUser.name,
        username: pendingUser.username,
        role: pendingUser.role,
      };
      req.session.sessionVersion = pendingUser.sessionVersion;
      req.session.device = {
        ...pendingDevice,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      await saveSession(req);
      return res.status(200).json({
        type: "success",
        message: "Logged In!",
        redirect:
          redirectTo !== "/"
            ? redirectTo
            : pendingUser.role === "admin"
              ? "/admin/dashboard"
              : "/",
      });
    } catch (error) {
      console.error("2 Factor Authentication OTP error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website POST Logout Controller
*********************************** */
const postLogout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("connect.sid");
    return res.json({
      type: "success",
      message: "Logged Out!",
      redirect: "/",
    });
  });
};
/* ***********************************
Website GET Forgot Password Controller
*********************************** */
const getForgotPassword = (req, res, next) => {
  res.render("auth/forgot", {
    currentPage: "Forgot Password",
    isLoggedIn: false,
    user: {},
  });
};
/* ***********************************
Website POST Forgot Password Controller
*********************************** */
const postForgotPassword = [
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required!")
    .bail()
    .isEmail()
    .withMessage("Invalid email!")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false }),
  async (req, res, next) => {
    const { email } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({
          type: "error",
          errors: errors.array(),
        });
      }
      const user = await User.findOne({ email }).select("email");
      if (!user) {
        return res.status(200).json({
          type: "success",
          message: "If this email exists, a reset link has been sent.",
        });
      }
      const resetURL = process.env.RESET_URL;
      if (!resetURL) {
        throw new Error("RESET_URL is not configured.");
      }
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: Date.now() + 15 * 60 * 1000,
          },
        },
      );
      const resetLink = `${resetURL}/${encodeURIComponent(token)}`;
      try {
        await transporter.sendMail({
          from: process.env.MAIL_FROM,
          to: user.email,
          subject: "Reset your password",
          html: ` 
      <h2 style="color: #0f172a; font-size: 24px; font-family: Arial, Helvetica, sans-serif; font-weight: 700; line-height: 1; margin: 0 0 10px;">Password Reset Request</h2>
      <p style="color: #64748b; font-size: 14px; font-family: Arial, Helvetica, sans-serif; 
      line-height: 1.5; margin: 0 0 20px;">Click the button below to reset your password:</p>
      <a style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; font-family: Arial, Helvetica, sans-serif; font-weight: 700; line-height: 1; padding: 15px 22px;  border-radius: 10px;" href="${resetLink}">Reset Password</a>
      <p style="color: #8a98ac; font-size: 12px; line-height: 1.5; margin: 20px 0 0;">This link will expire in 15 minutes.</p>
      `,
        });
      } catch (mailError) {
        try {
          await User.updateOne(
            {
              _id: user._id,
              resetPasswordToken: hashedToken,
            },
            {
              $unset: {
                resetPasswordToken: 1,
                resetPasswordExpires: 1,
              },
            },
          );
        } catch (cleanupError) {
          console.error("Reset Token cleanup failed:", cleanupError);
        }
        throw mailError;
      }
      return res.status(200).json({
        type: "success",
        message: "If this email exists, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website GET Reset Password Controller
*********************************** */
const getResetPassword = (req, res, next) => {
  const token = req.params.token;
  if (!token) {
    return res.status(400).json({
      type: "error",
      message: "Invalid or expired reset token",
    });
  }
  res.render("auth/reset", {
    currentPage: "Reset Password",
    isLoggedIn: false,
    user: {},
    token,
  });
};
/* ***********************************
Website POST Reset Password Controller
*********************************** */
const postResetPassword = [
  check("password")
    .notEmpty()
    .withMessage("Password is required!")
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("Password must be 12-72 characters long!")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter!")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter!")
    .bail()
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one numeric character!")
    .bail()
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/)
    .withMessage("Password must contain at least one special character!"),
  check("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required!")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match!");
      }
      return true;
    }),
  async (req, res, next) => {
    const { password } = req.body;
    const token = req.params.token;
    if (typeof token !== "string" || !/^[a-fA-F0-9]{64}$/.test(token)) {
      return res.status(400).json({
        type: "error",
        message: "Invalid or expired reset token",
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    try {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await User.findOneAndUpdate(
        {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: { $gt: Date.now() },
        },
        {
          $set: { password: hashedPassword },
          $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
          $inc: { sessionVersion: 1 },
        },
      );
      if (!user) {
        return res.status(400).json({
          type: "error",
          message: "Invalid or expired reset token",
        });
      }
      req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie("connect.sid");
        return res.status(200).json({
          type: "success",
          message: "Password Reset. Session Expire Please Login Again!",
          redirect: "/auth/login",
        });
      });
    } catch (error) {
      console.error("Reset password error:", error);
      return next(error);
    }
  },
];
/* ***********************************
                Exports
*********************************** */
module.exports = {
  getSignup,
  postSignup,
  getLogin,
  postLogin,
  post2fOTPReceived,
  postLogout,
  getForgotPassword,
  postForgotPassword,
  getResetPassword,
  postResetPassword,
};
