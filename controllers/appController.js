/* ***********************************
               Imports
*********************************** */
const path = require("path");
const Directory = require("../utils/util");
const escapeRegex = require("../utils/regex");
const Product = require("../models/productModel");
const Contact = require("../models/contactModel");
const NewsLetter = require("../models/newsLetterModel");
const { check, validationResult } = require("express-validator");
/* ***********************************
Website GET Home Controller
*********************************** */
const getHome = async (req, res, next) => {
  try {
    const products = await Product.find({ status: "Active" }).lean();
    res.render("pages/home", {
      currentPage: "Home",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      products,
      search: "",
    });
  } catch (error) {
    console.error("Home fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET About Controller
*********************************** */
const getAbout = (req, res, next) => {
  res.render(path.join(Directory, "views/pages/about"), {
    currentPage: "About",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
  });
};
/* ***********************************
Website GET Home Controller
*********************************** */
const getShop = async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const products = await Product.find(
      search
        ? {
            name: {
              $regex: escapeRegex(search),
              $options: "i",
            },
          }
        : {},
    ).limit(search ? 5 : 10).lean();
    if (req.get("X-Requested-With") === "XMLHttpRequest") {
      let productHTML = "";
      for (const product of products) {
        productHTML += await new Promise((resolve, reject) => {
          res.render(path.join(Directory, "views/partials/product"),
            { currentPage: "Shop", product },
            (error, html) => {
              if (error) return reject(error);
              resolve(html);
            },
          );
        });
      }
      return res.status(200).json({
        type: "success",
        productHTML, 
        countItems : products.length
      });
    }
    return res.render(path.join(Directory, "views/pages/shop"), {
      currentPage: "Shop",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search,
      products,
    });
  } catch (error) {
    console.error("Shop fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Contact Controller
*********************************** */
const getContact = (req, res, next) => {
  res.render(path.join(Directory, "views/pages/contact"), {
    currentPage: "Contact",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
  });
};
/* ***********************************
Website POST Contact Controller
*********************************** */
const postContact = [
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
    .withMessage("Please enter a valid email!")
    .normalizeEmail({ gmail_remove_dots: false }),
  check("subject").trim().notEmpty().withMessage("Subject is required!"),
  check("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required!")
    .bail()
    .isLength({ min: 100, max: 5000 })
    .withMessage("Message must be 100-5000 characters long!"),
  async (req, res, next) => {
    const { name, email, subject, message } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    try {
      await Contact.create({
        name,
        email,
        subject,
        message,
      });
      return res.status(201).json({
        type: "success",
        message: "Message Sent!",
      });
    } catch (error) {
      console.error("Contact error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website POST Search Controller
*********************************** */
const getSearch = async (req, res, next) => {
  const { search } = req.query;
  try {
    if (!search || search.trim() === "") {
      return res.render(path.join(Directory, "views/pages/search"), {
        currentPage: "Search",
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user,
        search: search,
        products: [],
        error: "Search Not Found!",
      });
    }
    const safeSearch = escapeRegex(search.trim());
    const products = await Product.find({
      name: { $regex: safeSearch, $options: "i" },
    }).lean();
    return res.render(path.join(Directory, "views/pages/search"), {
      currentPage: "Search",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: search,
      products: products,
      error: products.length === 0 ? "Search Not Found!" : null,
    });
  } catch (error) {
    console.error("Search error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Search Suggestions Controller
*********************************** */
const getSearchSuggestions = async (req, res, next) => {
  const query = req.query.query?.trim();
  if (!query) {
    return res.status(200).json([]);
  }
  const safeQuery = escapeRegex(query);
  try {
    const suggestions = await Product.find({
      name: { $regex: safeQuery, $options: "i" },
    })
      .select("name")
      .limit(5)
      .lean();
    return res.status(200).json(suggestions);
  } catch (error) {
    console.error("Search suggestions error:", error);
    return next(error);
  }
};
/* ***********************************
Website POST News Letter Controller
*********************************** */
const postNewsLetter = [
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required!")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email!")
    .normalizeEmail({ gmail_remove_dots: false })
    .custom(async (email) => {
      const existingEmail = await NewsLetter.exists({ email: email });
      if (existingEmail) {
        throw new Error("Email is already in subscribed!");
      }
      return true;
    }),
  async (req, res, next) => {
    const { email } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    try {
      await NewsLetter.create({ email });
      return res.status(201).json({
        type: "success",
        message: "Email Subscribed!",
      });
    } catch (error) {
      console.error("Newsletter error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website GET Privacy & Policy Controller
*********************************** */
const getPrivacyPolicy = (req, res, next) => {
  res.render(path.join(Directory, "views/pages/privacy-policy"), {
    currentPage: "Privacy & Policy",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
  });
};
/* ***********************************
Website GET Returns Policy Controller
*********************************** */
const getReturnsPolicy = (req, res, next) => {
  res.render(path.join(Directory, "views/pages/returns-policy"), {
    currentPage: "Returns & Policy",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
  });
};
/* ***********************************
Website GET Terms Conditions Controller
*********************************** */
const getTermsConditions = (req, res, next) => {
  res.render(path.join(Directory, "views/pages/terms-conditions"), {
    currentPage: "Terms Conditions",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
  });
};
/* ***********************************
               Exports
*********************************** */
module.exports = {
  getHome,
  getAbout,
  getShop,
  getContact,
  postContact,
  getSearch,
  getSearchSuggestions,
  postNewsLetter,
  getPrivacyPolicy,
  getReturnsPolicy,
  getTermsConditions,
};
