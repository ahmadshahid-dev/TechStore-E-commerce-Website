// Imports;
const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const session = require("express-session");
const mongoDbStore = require("connect-mongodb-session")(session);
const env = require("dotenv");
// Local Routes;
const appRoutes = require("./routes/appRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");
env.config();
// Random String Generator for Unique File Names;
const randomString = (length) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
// Multer Storage Configuration;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "image" || file.fieldname === "pdpImage") {
      cb(null, "uploads/products");
    } else if (file.fieldname === "profileImg") {
      cb(null, "uploads/users");
    } else {
      cb(new Error("Invalid file field"), null);
    }
  },

  filename: (req, file, cb) => {
    cb(null, randomString(5) + "-" + file.originalname);
  },
});
// Multer File Filter;
const fileFilter = (req, file, cb) => {
  if (["image/jpg", "image/jpeg", "image/png"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
// Multer Options;
const multerOptions = {
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};
// DataBase;
const { default: mongoose } = require("mongoose");
// Directory Utility;
const Directory = require("./utils/util");
// Express App Initialization;
const app = express();
app.use(express.json());
// EJS View Engine Setup;
app.set("view engine", "ejs");
app.set("views", path.join(Directory, "views"));
// CSS and JS Files Middleware;
app.use(express.static(path.join("public")));
// Upload Files Middleware;
app.use("/uploads", express.static(path.join(Directory, "uploads")));
// MongoDB Store;
const store = new mongoDbStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});
// Body Parser Middleware;
app.use(express.urlencoded({ extended: true }));
//Session Handling Middleware;
app.set('trust proxy', 1)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      httpOnly: true,
      secure: process.env.SESSION_SECURE === "true",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);
// Multer Fields Middleware;
app.use(multer(multerOptions).fields([
    { name: "image", maxCount: 1 },
    { name: "pdpImage", maxCount: 1 },
    { name: "profileImg", maxCount: 1 },
  ]),
);
// Routes Middlewares;
app.use(appRoutes);
app.use("/auth", authRoutes);
app.use(userRoutes);
app.use("/admin", adminRoutes);
app.use("/category", categoriesRoutes);
// Error Handling Middleware;
app.use((error, req, res, next) => {
  // MongoDB Errors;
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "field";
    return res.status(409).json({
      type: "error",
      message: `${field} already exists!`,
    });
  }
  // Rate Limit
  if (error.status === 429) {
    return res.status(429).json({
      type: "error",
      message: "Too many requests! Please try again letter.",
    });
  }
  // Upload Img Size Errors;
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(422).json({
      type: "error",
      errors: [
        {
          path: error.field || "image",
          msg: "File size must not exceed 5 MB!",
        },
      ],
    });
  }
  // Validation Errors;
  if (error.name === "ValidationError") {
    const msg = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ type: "error", message: msg });
  }
  // Cast Errors;
  if (error.name === "CastError") {
    return res.status(400).json({
      type: "error",
      message: `Invalid ${error.path}!`,
    });
  }
  // Custom operational Errors;
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      type: "error",
      message: error.message,
    });
  }
  // Unknown / Unexpected Errors;
  console.error("ðŸ’¥ UNEXPECTED ERROR:", error);
  if (res.headersSent) return next(error);
  // API Request;
  if (req.headers["content-type"]?.includes("application/json") || req.xhr) {
    return res.status(500).json({
      type: "error",
      message: "Internal server error",
    });
  }
  // Page Request â†’ Render Error Page;
  res.status(500).render(path.join(Directory, "views/errors/500"), {
    currentPage: "500 Server Error",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
  });
});
// 404 Error Handling Middleware;
app.use((req, res, next) => {
  res.render(path.join(Directory, "views/errors/404"), {
    currentPage: "404",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
  });
});
// PORT;
const PORT = process.env.PORT;
// Database Connection;
try {
  mongoose.connect(process.env.MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`server starting on address : http://localhost:${PORT}`);
  });
} catch (error) {
  console.log(`Mongoose Not Connected! ${error}`);
}
