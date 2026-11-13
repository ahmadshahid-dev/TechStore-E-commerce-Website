/* ***********************************
               Imports
*********************************** */
const { validateId } = require("../utils/validate");
const { uploadImage, deleteImages } = require("../utils/cloudinary");
const { getCheckoutData } = require("../utils/checkout");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const BCRYPT_ROUNDS = 12;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  crypto.randomBytes(32).toString("hex"),
  BCRYPT_ROUNDS,
);
const MAX_BCRYPT_BYTES = 72;
const hasValidBcryptLength = (value) => {
  if (Buffer.byteLength(value, "utf8") > MAX_BCRYPT_BYTES) {
    throw new Error("Password is too long!");
  }
  return true;
};
const { default: mongoose } = require("mongoose");
const Sessions = () => mongoose.connection.collection("sessions");
const productAndUser = async (productId, userId) => {
  return Promise.all([
    Product.exists({ _id: productId }),
    User.findById(userId),
  ]);
};
/* ***********************************
Website GET Profile Controller
*********************************** */
const getProfile = async (req, res, next) => {
  const userId = req.session.user.userId;
  try {
    const [
      user,
      totalOrders,
      deliveredOrders,
      activeOrders,
      cancelledOrders,
      totalAddresses,
      primaryAddress,
      recentOrders,
    ] = await Promise.all([
      User.findById(userId).lean(),
      Order.countDocuments({ userId }),
      Order.countDocuments({ orderStatus: "Delivered", userId }),
      Order.countDocuments({ orderStatus: "Confirmed", userId }),
      Order.countDocuments({ orderStatus: "Cancelled", userId }),
      Address.countDocuments({ userId }),
      Address.findOne({ isDefault: true, userId }).lean(),
      Order.find({ userId }).sort({ createdAt: -1 }).lean().limit(2),
    ]);
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User Not Found!",
      });
    }
    res.render("user/profile", {
      currentPage: "Profile Overview",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      _user: user,
      totalOrders,
      deliveredOrders,
      activeOrders,
      cancelledOrders,
      totalAddresses,
      primaryAddress,
      recentOrders,
    });
  } catch (error) {
    console.error("User profile fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website POST Edit Profile Controller
*********************************** */
const putEditProfile = [
  check("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required!")
    .bail()
    .matches(/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/)
    .withMessage("First name contains invalid characters!")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be 2-50 characters long!"),
  check("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required!")
    .bail()
    .matches(/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/)
    .withMessage("Last name contains invalid characters!")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be 2-50 characters long!"),
  check("dateOfBirth")
    .trim()
    .notEmpty()
    .withMessage("Date of birth is required!")
    .bail()
    .isDate()
    .withMessage("Please enter a valid date of birth!"),
  check("gender")
    .trim()
    .notEmpty()
    .withMessage("Gender is required!")
    .bail()
    .isIn(["Male", "Female"])
    .withMessage("Invalid gender!"),
  check("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required!")
    .bail()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3-30 characters long!")
    .bail()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores!")
    .bail()
    .toLowerCase()
    .custom(async (username, { req }) => {
      const existingUser = await User.exists({
        username,
        _id: { $ne: req.session.user?.userId },
      });
      if (existingUser) {
        throw new Error("Username already in use!");
      }
      return true;
    }),
  check("phone")
    .optional({ values: "falsy" })
    .trim()
    .isMobilePhone("en-PK")
    .withMessage("Please enter a valid phone number!")
    .bail()
    .custom(async (phone, { req }) => {
      const phoneExists = await User.exists({
        phone,
        _id: { $ne: req.session.user?.userId },
      });
      if (phoneExists) {
        throw new Error("Phone number already in use!");
      }
      return true;
    }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const userId = req.session.user.userId;
    const { firstName, lastName, gender, dateOfBirth, username, phone } =
      req.body;
    let saved = false;
    const uploadedImgs = [];
    const replacedImgs = [];
    const profileImg = req.files?.profileImg?.[0];
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          type: "error",
          message: "User Not Found!",
        });
      }
      if (profileImg) {
        const img = await uploadImage(profileImg, "users");
        uploadedImgs.push(img.publicId);
        replacedImgs.push(user.profileImgPublicId);
        user.profileImg = img.url;
        user.profileImgPublicId = img.publicId;
      }
      Object.assign(user, {
        firstName,
        lastName,
        gender,
        dateOfBirth,
        username,
        phone,
      });
      await user.save();
      saved = true;
      await deleteImages(replacedImgs);
      req.session.user.username = username;
      req.session.save((error) => {
        if (error) return next(error);
        return res.status(200).json({
          type: "success",
          message: "Profile Updated!",
          redirect: `/@${encodeURIComponent(username)}/profile-overview`,
        });
      });
    } catch (error) {
      if (!saved) {
        await deleteImages(uploadedImgs);
      }
      console.error("Update profile error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website GET Address Book Controller
*********************************** */
const getAddressBook = async (req, res, next) => {
  const userId = req.session.user.userId;
  try {
    const addresses = await Address.find({ userId }).lean();
    const totalAddresses = addresses.length;
    return res.render("user/address-book", {
      currentPage: "Address Book",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      addresses,
      totalAddresses,
      search: "",
    });
  } catch (error) {
    console.error("Address Book fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Address Add Controller
*********************************** */
const getAddressAdd = (req, res, next) => {
  return res.render("user/address-add-edit", {
    currentPage: "Address Add",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    editing: false,
    search: "",
  });
};
/* ***********************************
Website POST Address Add Controller
*********************************** */
const postAddressAdd = [
  check("label")
    .optional()
    .trim()
    .isIn(["Home", "Office", "Other"])
    .withMessage("Invalid label!"),
  check("fullName")
    .trim()
    .notEmpty()
    .withMessage("Name is required!")
    .bail()
    .matches(/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/)
    .withMessage("Name contains invalid characters!")
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be 3-100 characters long!"),
  check("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone Number is required!")
    .bail()
    .isMobilePhone("en-PK")
    .withMessage("Please enter a valid phone number!")
    .bail()
    .custom(async (phone, { req }) => {
      const phoneExists = await Address.exists({
        phone,
        userId: req.session.user?.userId,
      });
      if (phoneExists) {
        throw new Error("Phone number already in use!");
      }
      return true;
    }),
  check("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required!")
    .bail()
    .equals("Pakistan")
    .withMessage("Only Pakistan is supported!"),
  check("province")
    .trim()
    .notEmpty()
    .withMessage("Province is required!")
    .bail()
    .isIn([
      "Punjab",
      "Sindh",
      "Khyber Pakhtunkhwa",
      "Balochistan",
      "Azad Kashmir",
      "Gilgit Baltistan",
    ])
    .withMessage("Invalid province!"),
  check("city")
    .trim()
    .notEmpty()
    .withMessage("City is required!")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be 2-100 characters long!"),
  check("postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal Code is required!")
    .bail()
    .isPostalCode("PK")
    .withMessage("Please enter a valid postal code!")
    .bail()
    .isLength({ min: 3, max: 10 })
    .withMessage("Postal code must be 3–10 characters long!"),
  check("stateAddress")
    .trim()
    .notEmpty()
    .withMessage("Address is required!")
    .bail()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be 5–200 characters long!"),
  check("isDefault")
    .optional()
    .trim()
    .isBoolean()
    .withMessage("Invalid default address!")
    .toBoolean()
    .custom(async (isDefault, { req }) => {
      if (!isDefault) return true;
      const defaultExist = await Address.exists({
        userId: req.session.user.userId,
        isDefault: true,
      });
      if (defaultExist) {
        throw new Error("Already Set Default Address!");
      }
      return true;
    }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const { userId, username } = req.session.user;
    const {
      label,
      fullName,
      phone,
      country,
      province,
      city,
      postalCode,
      stateAddress,
      isDefault,
    } = req.body;
    try {
      const addressCount = await Address.countDocuments({ userId });
      if (addressCount >= 2) {
        delete req.session.returnToCheckout;
        return res.status(400).json({
          type: "error",
          message: "You can only have 2 Addresses!",
        });
      }
      await Address.create({
        userId,
        label,
        fullName,
        phone,
        country,
        province,
        city,
        postalCode,
        stateAddress,
        isDefault: addressCount === 0 ? true : isDefault,
      });
      const returnToCheckout = req.session.returnToCheckout;
      if (returnToCheckout) delete req.session.returnToCheckout;
      const redirecting = returnToCheckout
        ? `/@${encodeURIComponent(username)}/checkout`
        : `/@${encodeURIComponent(username)}/address-book`;
      return res.status(201).json({
        type: "success",
        message: "Address Added!",
        redirect: redirecting,
      });
    } catch (error) {
      console.error("Address Add error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website GET Address Edit Controller
*********************************** */
const getAddressEdit = async (req, res, next) => {
  const addressId = req.params.id;
  const userId = req.session.user.userId;
  if (!validateId(addressId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Address!",
    });
  }
  const editing = req.query.editing === "true";
  try {
    const address = await Address.findOne({ _id: addressId, userId }).lean();
    if (!address) {
      return res.status(404).json({
        type: "error",
        message: "Address Not Found!",
      });
    }
    return res.render("user/address-add-edit", {
      currentPage: "Address Edit",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      editing,
      address,
      search: "",
    });
  } catch (error) {
    console.error("Address Edit fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website PUT Address Edit Controller
*********************************** */
const putAddressEdit = [
  check("label")
    .optional()
    .trim()
    .isIn(["Home", "Office", "Other"])
    .withMessage("Invalid label!"),
  check("fullName")
    .trim()
    .notEmpty()
    .withMessage("Name is required!")
    .bail()
    .matches(/^[a-zA-Z]+(?:[ '-][a-zA-Z]+)*$/)
    .withMessage("Name contains invalid characters!")
    .bail()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be 3-100 characters long!"),
  check("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone Number is required!")
    .bail()
    .isMobilePhone("en-PK")
    .withMessage("Please enter a valid phone number!")
    .bail()
    .custom(async (phone, { req }) => {
      const existingPhone = await Address.exists({
        _id: { $ne: req.body._id },
        userId: req.session.user?.userId,
        phone,
      });
      if (existingPhone) {
        throw new Error("Phone number already in use!");
      }
      return true;
    }),
  check("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required!")
    .bail()
    .equals("Pakistan")
    .withMessage("Only Pakistan is supported!"),
  check("province")
    .trim()
    .notEmpty()
    .withMessage("Province is required!")
    .bail()
    .isIn([
      "Punjab",
      "Sindh",
      "Khyber Pakhtunkhwa",
      "Balochistan",
      "Azad Kashmir",
      "Gilgit Baltistan",
    ])
    .withMessage("Invalid province!"),
  check("city")
    .trim()
    .notEmpty()
    .withMessage("City is required!")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be 2-100 characters long!"),
  check("postalCode")
    .trim()
    .notEmpty()
    .withMessage("Postal Code is required!")
    .bail()
    .isPostalCode("PK")
    .withMessage("Please enter a valid postal code!")
    .bail()
    .isLength({ min: 3, max: 10 })
    .withMessage("Postal code must be 3–10 characters long!"),
  check("stateAddress")
    .trim()
    .notEmpty()
    .withMessage("Address is required!")
    .bail()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be 5–200 characters long!"),
  check("isDefault")
    .optional()
    .trim()
    .isBoolean()
    .withMessage("Invalid default address!")
    .toBoolean()
    .custom(async (isDefault, { req }) => {
      if (!isDefault) return true;
      const defaultExist = await Address.exists({
        _id: { $ne: req.body._id },
        userId: req.session.user?.userId,
        isDefault: true,
      });
      if (defaultExist) {
        throw new Error("Already Set Default Address!");
      }
      return true;
    }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const { userId, username } = req.session.user;
    const {
      _id,
      label,
      fullName,
      phone,
      country,
      province,
      city,
      postalCode,
      stateAddress,
      isDefault,
    } = req.body;
    if (!validateId(_id)) {
      return res.status(400).json({
        type: "error",
        message: "Invalid Address!",
      });
    }
    try {
      const address = await Address.findOne({ _id, userId });
      if (!address) {
        return res.status(404).json({
          type: "error",
          message: "Address Not Found!",
        });
      }
      const addressCount = await Address.countDocuments({ userId });
      const shouldBeDefault =
        addressCount === 1 ? true : (isDefault ?? address.isDefault);
      Object.assign(address, {
        userId,
        label,
        fullName,
        phone,
        country,
        province,
        city,
        postalCode,
        stateAddress,
        isDefault: shouldBeDefault,
      });
      await address.save();
      return res.status(200).json({
        type: "success",
        message: "Address Updated!",
        redirect: `/@${encodeURIComponent(username)}/address-book`,
      });
    } catch (error) {
      console.error("Address Edit error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website POST Set Default Address Controller
*********************************** */
const setDefaultAddress = async (req, res, next) => {
  const { userId, username } = req.session.user;
  const addressId = req.params.id;
  if (!validateId(addressId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Address!",
    });
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Address.updateMany(
        { userId },
        { $set: { isDefault: false } },
        { session },
      );
      const address = await Address.updateOne(
        { _id: addressId, userId },
        { $set: { isDefault: true } },
        { session },
      );
      if (address.matchedCount === 0) {
        const error = new Error("Address Not Found!");
        error.statusCode = 404;
        throw error;
      }
    });
    const returnToCheckout = req.session.returnToCheckout;
    if (returnToCheckout) delete req.session.returnToCheckout;
    const redirecting = returnToCheckout
      ? `/@${encodeURIComponent(username)}/checkout`
      : null;
    return res.status(200).json({
      type: "success",
      message: "Set as Default Address!",
      redirect: redirecting,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({
        type: "error",
        message: "Address Not Found!",
      });
    }
    console.error("Set as default error:", error);
    return next(error);
  } finally {
    await session.endSession();
  }
};
/* ***********************************
Website POST Delete Address Controller
*********************************** */
const deleteAddress = async (req, res, next) => {
  const addressId = req.params.id;
  if (!validateId(addressId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Address!",
    });
  }
  const userId = req.session.user.userId;
  try {
    const address = await Address.findOneAndDelete({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({
        type: "error",
        message: "Address Not Found!",
      });
    }
    const countAddress = await Address.countDocuments({ userId });
    return res.status(200).json({
      type: "success",
      message: "Address Deleted!",
      countAddress,
    });
  } catch (error) {
    console.error("Address Delete error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Privacy Security Controller
*********************************** */
const getPrivacySecurity = async (req, res, next) => {
  const userId = req.session.user?.userId;
  try {
    const [_user, fetchingSessions] = await Promise.all([
      User.findById(userId)
        .select("+email +verificationStatus +twoFctrVerification")
        .lean(),
      Sessions()
        .find({
          "session.user.userId": userId,
          expires: { $gt: new Date() },
        })
        .toArray(),
    ]);
    const sessions = fetchingSessions.map((d) => ({ ...d.session.device, isCurrent: d._id === req.sessionID })).sort((a, b) => b.isCurrent - a.isCurrent || (b.lastActive || b.createdAt) - (a.lastActive || a.createdAt));
    console.log("Sessions:", sessions);
    res.render("user/privacy-security", {
      currentPage: "",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      _user,
      sessions,
    });
  } catch (error) {
    console.error("Privacy & Security fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Favourites Controller
*********************************** */
const getFavourites = async (req, res, next) => {
  const userId = req.session.user.userId;
  try {
    const user = await User.findById(userId)
      .populate(
        "favourites",
        "_id sku category image name currentPrice originalPrice",
      )
      .select("favourites")
      .lean();
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User Not Found!",
      });
    }
    const favItems = user.favourites
      .filter((product) => product)
      .map((item) => ({
        _id: item._id,
        sku: item.sku,
        category: item.category,
        image: item.image,
        name: item.name,
        currentPrice: item.currentPrice,
        originalPrice: item.originalPrice,
      }));
    res.render("user/favourites", {
      currentPage: "Favourites",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      favItems,
    });
  } catch (error) {
    console.error("favourites fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website POST Favourites Controller
*********************************** */
const postFavourites = async (req, res, next) => {
  const productId = req.params.id;
  if (!validateId(productId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Product!",
    });
  }
  const userId = req.session.user.userId;
  try {
    const [product, user] = await productAndUser(productId, userId);
    if (!product) {
      return res.status(404).json({
        type: "error",
        message: "Product Not Found!",
      });
    }
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User Not Found!",
      });
    }
    const existsInFavourites = user.favourites.some(
      (favourite) => favourite.toString() === productId,
    );
    if (existsInFavourites) {
      return res.status(409).json({
        type: "error",
        message: "Already In Favourites!",
      });
    }
    await user.updateOne({ $push: { favourites: productId } });
    return res.status(201).json({
      type: "success",
      message: "Added To Favourites!",
    });
  } catch (error) {
    console.error("Add to favourites error:", error);
    return next(error);
  }
};
/* ***********************************
Website DELETE Remove Favourites Controller
*********************************** */
const removeFromFavourites = async (req, res, next) => {
  const productId = req.params.id;
  if (!validateId(productId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Product!",
    });
  }
  const userId = req.session.user.userId;
  try {
    const [product, user] = await productAndUser(productId, userId);
    if (!product) {
      return res.status(404).json({
        type: "error",
        message: "Product Not Found!",
      });
    }
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User Not Found!",
      });
    }
    const existsInFavourites = user.favourites.some(
      (favourite) => favourite.toString() === productId,
    );
    if (!existsInFavourites) {
      return res.status(404).json({
        type: "error",
        message: "Product Not In Favourites!",
      });
    }
    const findAndUpdateUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { favourites: productId },
      },
      { returnDocument: "after" },
    );
    const favouritesCount = findAndUpdateUser.favourites.length;
    return res.status(200).json({
      type: "success",
      message: "Removed From Favourites!",
      countItems: favouritesCount,
    });
  } catch (error) {
    console.error("Remove from favourites error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Cart Controller
*********************************** */
const getCart = async (req, res, next) => {
  const userId = req.session.user.userId;
  try {
    const user = await User.findById(userId)
      .populate(
        "items.productId",
        "_id category sku image name currentPrice originalPrice",
      )
      .select("items")
      .lean();
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User Not Found!",
      });
    }
    const cartItems = user.items
      .filter((item) => item.productId)
      .map((item) => ({
        _id: item.productId._id,
        category: item.productId.category,
        sku: item.productId.sku,
        image: item.productId.image,
        name: item.productId.name,
        currentPrice: item.productId.currentPrice,
        originalPrice: item.productId.originalPrice,
        quantity: item.quantity,
      }));
    res.render("user/cart", {
      currentPage: "Cart",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      cartItems,
    });
  } catch (error) {
    console.error("Cart fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website POST Cart Controller
*********************************** */
const postCart = async (req, res, next) => {
  const productId = req.params.id;
  if (!validateId(productId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Product!",
    });
  }
  const userId = req.session.user.userId;
  let { quantity } = req.body;
  quantity = Number(quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    return res.status(400).json({
      type: "error",
      message: "Quantity must be a number between 1 and 10!",
    });
  }
  try {
    const product = await Product.findById(productId).select("currentPrice");
    const user = await User.findById(userId);
    if (!product) {
      return res.status(404).json({
        type: "error",
        message: "Product Not Found!",
      });
    }
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User Not Found!",
      });
    }
    const price = Number(product.currentPrice);
    const existsInCart = user.items.find(
      (cart) => cart.productId.toString() === productId,
    );
    if (existsInCart) {
      existsInCart.quantity += quantity;
      existsInCart.price += price * quantity;
      await user.save();
      return res.status(200).json({
        type: "success",
        message: "Cart Updated!",
      });
    }
    await user.updateOne({
      $push: { items: { productId, quantity, price } },
    });
    return res.status(201).json({
      type: "success",
      message: "Added To Cart!",
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return next(error);
  }
};
/* ***********************************
Website PUT Cart Update Quantity Controller
*********************************** */
const updateCartQuantity = async (req, res, next) => {
  const productId = req.params.id;
  if (!validateId(productId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Product!",
    });
  }
  const userId = req.session.user.userId;
  let { quantity } = req.body;
  quantity = Number(quantity);
  if (!Number.isInteger(quantity) || quantity > 10) {
    return res.status(400).json({
      type: "error",
      message: "Quantity must be a number between 1 and 10!",
    });
  }
  try {
    const product = await Product.findById(productId).select("currentPrice");
    const user = await User.findById(userId);
    if (!product) {
      return res.status(404).json({
        type: "error",
        message: "Product Not Found!",
      });
    }
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User Not Found!",
      });
    }
    const price = Number(product.currentPrice);
    const existsInCart = user.items.find(
      (cart) => cart.productId.toString() === productId,
    );
    if (!existsInCart) {
      return res.status(404).json({
        type: "error",
        message: "Product Not In Cart!",
      });
    }
    existsInCart.quantity = quantity;
    existsInCart.price = price * quantity;
    await user.save();
    const findUserCartItems = await User.findById(userId)
      .populate("items.productId", "_id currentPrice originalPrice")
      .select("items")
      .lean();
    const filterCartItems = findUserCartItems.items
      .filter((item) => item.productId)
      .map((item) => ({
        _id: item.productId._id,
        currentPrice: item.productId.currentPrice,
        originalPrice: item.productId.originalPrice,
        quantity: item.quantity,
      }));
    return res.status(200).json({
      type: "success",
      message: "Quantity Updated!",
      cartItems: filterCartItems,
      cartUpdatedItem: existsInCart,
    });
  } catch (error) {
    console.error("Update cart quantity error:", error);
    return next(error);
  }
};
/* ***********************************
Website DELTE Remove Cart Controller
*********************************** */
const removeFromCart = async (req, res, next) => {
  const productId = req.params.id;
  if (!validateId(productId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Product!",
    });
  }
  const userId = req.session.user.userId;
  try {
    const [product, user] = await productAndUser(productId, userId);
    if (!product) {
      return res.status(404).json({
        type: "error",
        message: "Product Not Found!",
      });
    }
    if (!user) {
      return res.status(404).json({
        type: "error",
        message: "User Not Found!",
      });
    }
    const existsInCart = user.items.some(
      (cart) => cart.productId.toString() === productId,
    );
    if (!existsInCart) {
      return res.status(404).json({
        type: "error",
        message: "Product Not In Cart!",
      });
    }
    const findAndUpdateUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { items: { productId } },
      },
      { returnDocument: "after" },
    );
    const findUserCartItems = await User.findById(userId)
      .populate("items.productId")
      .select("items")
      .lean();
    const filterCartItems = findUserCartItems.items
      .filter((item) => item.productId)
      .map((item) => ({
        _id: item.productId._id,
        currentPrice: item.productId.currentPrice,
        originalPrice: item.productId.originalPrice,
        quantity: item.quantity,
      }));
    const cartCount = findAndUpdateUser.items.length;
    return res.status(200).json({
      type: "success",
      message: "Removed From Cart!",
      cartItems: filterCartItems,
      countItems: cartCount,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Checkout Controller
*********************************** */
const getCheckout = async (req, res, next) => {
  try {
    const data = await getCheckoutData(req.session?.user);
    if (data.status !== 200) {
      if (data.redirect) return res.redirect(data.redirect || "/");
    }
    return res.render("user/checkout", {
      currentPage: "Checkout",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      cartItems: data.cartItems,
      address: data.address,
    });
  } catch (error) {
    console.error("Checkout fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Checkout Vaildations Controller
*********************************** */
const checkoutValidations = async (req, res, next) => {
  try {
    const data = await getCheckoutData(req.session?.user);
    if (data.returnToCheckout) {
      req.session.returnToCheckout = true;
    }
    if (data.status !== 200) {
      return res.status(data.status).json({
        type: "error",
        message: data.message,
        ...(data.redirect && { redirect: data.redirect }),
      });
    }
    return res.status(200).json({
      type: "success",
      redirect: `/@${encodeURIComponent(data.username)}/checkout`,
    });
  } catch (error) {
    console.error("Checkout Data fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website POST Checkout Controller
*********************************** */
const postCheckout = [
  check("orderEmail")
    .trim()
    .notEmpty()
    .withMessage("Order email is required!")
    .bail()
    .isEmail()
    .withMessage("Invalid email!")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false }),
  check("shippingMethod")
    .trim()
    .notEmpty()
    .withMessage("Shipping method is required!")
    .bail()
    .isIn(["Express", "Standard"])
    .withMessage("Invalid shipping method! Choose Express or Standard."),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const { userId, username } = req.session.user;
    const { addressId, orderEmail, shippingMethod } = req.body;
    if (!validateId(addressId)) {
      return res.status(400).json({
        type: "error",
        message: "Invalid Address!",
      });
    }
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const user = await User.findById(userId)
        .populate("items.productId")
        .select("items")
        .lean();
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({
          type: "error",
          message: "User Not Found!",
        });
      }
      const cartItems = user.items
        .filter((item) => item.productId)
        .map((item) => ({
          _id: item.productId._id,
          image: item.productId.image,
          name: item.productId.name,
          stockQuantity: item.productId.stockQuantity,
          quantity: item.quantity,
          price: item.price,
        }));
      if (cartItems.length === 0) {
        await session.abortTransaction();
        return res.status(404).json({
          type: "error",
          message: "Your cart is empty!",
          redirect: `/@${encodeURIComponent(username)}/cart`,
        });
      }
      const quantityInvalid = cartItems.some(
        (item) => item.quantity < 1 || item.quantity > 10,
      );
      if (quantityInvalid) {
        await session.abortTransaction();
        return res.status(400).json({
          type: "error",
          message: "Quantity must be a number between 1 and 10!",
        });
      }
      const stockInvalid = cartItems.some(
        (item) => item.quantity > item.stockQuantity,
      );
      if (stockInvalid) {
        await session.abortTransaction();
        return res.status(400).json({
          type: "error",
          message: "Requested quantity is greater than available stock!",
        });
      }
      const orderItems = cartItems.map((item) => ({
        image: item.image,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      const shipping = shippingMethod === "Express" ? 500 : 200;
      const subTotal = orderItems.reduce((sum, item) => sum + item.price, 0);
      const grandTotal = subTotal + shipping;
      const address = await Address.findById(addressId)
        .select("fullName phone country province city postalCode stateAddress")
        .lean();
      if (!address) {
        await session.abortTransaction();
        return res.status(404).json({
          type: "error",
          message: "Address Not Found!",
        });
      }
      const [order] = await Order.create(
        [
          {
            userId,
            orderEmail,
            items: orderItems,
            grandTotal,
            address: {
              fullName: address.fullName,
              phone: address.phone,
              country: address.country,
              province: address.province,
              city: address.city,
              postalCode: address.postalCode,
              stateAddress: address.stateAddress,
            },
            shippingMethod,
          },
        ],
        { session },
      );
      const stockUpdates = await Product.bulkWrite(
        cartItems.map((item) => ({
          updateOne: {
            filter: {
              _id: item._id,
              stockQuantity: { $gte: item.quantity },
            },
            update: {
              $inc: {
                stockQuantity: -item.quantity,
              },
            },
          },
        })),
        { session },
      );
      if (stockUpdates.matchedCount !== cartItems.length) {
        throw new Error("Stock changed before order completion.");
      }
      await User.findByIdAndUpdate(userId, { items: [] }, { session });
      await session.commitTransaction();
      return res.status(201).json({
        type: "success",
        message: "Order Placed Successfully!",
        redirect: `/@${encodeURIComponent(username)}/order-success/${order.orderId}`,
      });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      console.error("Order Creating error:", error);
      return next(error);
    } finally {
      await session.endSession();
    }
  },
];
/* ***********************************
Website GET Order Success Controller
*********************************** */
const getOrderSuccess = async (req, res, next) => {
  const userId = req.session.user.userId;
  const orderId = req.params.orderId;
  if (!orderId) {
    return res.status(404).json({
      type: "error",
      message: "Invalid Order!",
    });
  }
  try {
    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      return res.status(400).json({
        type: "error",
        message: "Order Not Found!",
      });
    }
    res.render("user/order-success", {
      currentPage: "Order Tracking",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      order,
    });
  } catch (error) {
    console.error("Order success fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET My Orders Controller
*********************************** */
const getMyOrders = async (req, res, next) => {
  const userId = req.session.user.userId;
  const orders = await Order.find({ userId });
  res.render("user/my-orders", {
    currentPage: "My Orders",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
    orders,
  });
};
/* ***********************************
Website GET Order Tracking Controller
*********************************** */
const getOrderTracking = (req, res, next) => {
  res.render("user/order-tracking", {
    currentPage: "Order Tracking",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    search: "",
  });
};
/* ***********************************
Website GET Order Tracking Controller
*********************************** */
const postOrderTracking = [
  check("orderId")
    .trim()
    .notEmpty()
    .withMessage("Order id is required!")
    .bail()
    .isLength({ min: 10 })
    .withMessage("Order id must be at least 10 characters long!")
    .bail()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage(
      "Invalid order id! Only letters, numbers, and hyphens are allowed.",
    ),
  check("orderEmail")
    .trim()
    .notEmpty()
    .withMessage("Order email is required!")
    .bail()
    .isEmail()
    .withMessage("Invalid email!")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const { orderId, orderEmail } = req.body;
    try {
      const order = await Order.findOne({ orderId, orderEmail }).lean();
      if (!order) {
        return res.status(404).json({
          type: "error",
          message: "Order Not Found!",
        });
      }
      return res.status(200).json({
        type: "success",
        order,
      });
    } catch (error) {
      console.error("Order Tracking error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website PUT/Change Email Controller
*********************************** */
const putChangeEmail = [
  check("newEmail")
    .trim()
    .notEmpty()
    .withMessage("Email is required!")
    .bail()
    .isEmail()
    .withMessage("Invalid email!")
    .bail()
    .normalizeEmail({ gmail_remove_dots: false })
    .custom(async (email, { req }) => {
      const existingUser = await User.exists({
        email,
        _id: { $ne: req.session.user?.userId },
      });
      if (existingUser) {
        throw new Error(`Email already in use!`);
      }
    }),
  check("confirmCurrentPassword")
    .trim()
    .notEmpty()
    .withMessage("Password is required!")
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("Invalid Password!")
    .bail()
    .custom(hasValidBcryptLength),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const { userId, username } = req.session.user;
    const { newEmail, confirmCurrentPassword } = req.body;
    try {
      const user = await User.findById(userId).select("+password");
      const passwordMatch = await bcrypt.compare(
        confirmCurrentPassword,
        user?.password || DUMMY_PASSWORD_HASH,
      );
      if (!user || !passwordMatch) {
        return res.status(422).json({
          type: "error",
          errors: [
            { path: "confirmCurrentPassword", msg: "Invalid credentials!" },
          ],
        });
      }
      user.email = newEmail;
      await user.save();
      return res.status(200).json({
        type: "success",
        message: "Email Updated!",
        redirect: `/@${encodeURIComponent(username)}/profile-overview`,
      });
    } catch (error) {
      console.error("PUT Email error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website PUT/Change Password Controller
*********************************** */
const putChangePassword = [
  check("currentPassword")
    .trim()
    .notEmpty()
    .withMessage("Password is required!")
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("Invalid Password!")
    .bail()
    .custom(hasValidBcryptLength),
  check("newPassword")
    .trim()
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
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required!")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Passwords do not match!");
      }
      return true;
    }),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const userId = req.session.user.userId;
    const { currentPassword, newPassword } = req.body;
    try {
      const user = await User.findById(userId).select("+password");
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user?.password || DUMMY_PASSWORD_HASH,
      );
      if (!user || !passwordMatch) {
        return res.status(422).json({
          type: "error",
          errors: [{ path: "currentPassword", msg: "Invalid credentials!" }],
        });
      }
      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      const result = await User.updateOne(
        {
          _id: user._id,
          password: user.password,
        },
        {
          $set: { password: hashedPassword },
        },
      );
      if (result.modifiedCount !== 1) {
        return res.status(422).json({
          type: "error",
          errors: [
            {
              path: "currentPassword",
              msg: "Password changed elsewhere. Please try again!",
            },
          ],
        });
      }
      return res.status(200).json({
        type: "success",
        message: "Password Updated!",
      });
    } catch (error) {
      console.error("PUT Password error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website PUT 2 Factor Auth Controller
*********************************** */
const put2FactorAuth = [
  check("_2fctrCurntPaswrd")
    .trim()
    .notEmpty()
    .withMessage("Password is required!")
    .bail()
    .isLength({ min: 12, max: 72 })
    .withMessage("Invalid Password!")
    .bail()
    .custom(hasValidBcryptLength),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const userId = req.session.user.userId;
    const { _2fctrCurntPaswrd } = req.body;
    try {
      const user = await User.findById(userId).select(
        "+password +twoFctrVerification",
      );
      const passwordMatch = await bcrypt.compare(
        _2fctrCurntPaswrd,
        user?.password || DUMMY_PASSWORD_HASH,
      );
      if (!user || !passwordMatch) {
        return res.status(422).json({
          type: "error",
          errors: [{ path: "_2fctrCurntPaswrd", msg: "Invalid credentials!" }],
        });
      }
      const twoFctrVerification = !user.twoFctrVerification;
      await user.updateOne({
        $set: { twoFctrVerification },
      });
      return res.status(200).json({
        type: "success",
        checked: twoFctrVerification,
        message: `2 Factor Authentication ${twoFctrVerification ? "ON" : "OFF"}!`,
      });
    } catch (error) {
      console.error("PUT 2 Factor Authentication error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website POST Revoke Session Controller
*********************************** */
const postRevokeSession = async (req, res, next) => {
  const deviceId = req.params.id;
  const userId = req.session.user.userId;
  try {
    if (deviceId === req.session.device?.id) {
      return res.status(400).json({
        type: "error",
        message: "Cannot revoke current session!",
      });
    }
    await Sessions().deleteOne({
      "session.user.userId": userId,
      "session.device.id": deviceId,
    });
    return res.status(200).json({
      type: "success",
      message: "Session Revoked!",
    });
  } catch (error) {
    console.error("Revoke Session error:", error);
    return next(error);
  }
};
/* ***********************************
Website POST Sign Out All Controller
*********************************** */
const postSignOutAll = async (req, res, next) => {
  const userId = req.session.user.userId;
  try {
    await User.updateOne({ _id: userId }, { $inc: { sessionVersion: 1 } });
    await Sessions().deleteMany({ "session.user.userId": userId });
    return req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("connect.sid");
      res.json({
        type: "success",
        message: "All Sessions Signed Out!",
        redirect: "/auth/login",
      });
    });
  } catch (error) {
    console.error("Sign Out All error:", error);
    return next(error);
  }
};
/* ***********************************
Website DELETE Account & Data Controller
*********************************** */
const DeleteAccountAndData = [
  check("Confirmation")
    .trim()
    .notEmpty()
    .withMessage("Confirmation is required!")
    .equals("DELETE")
    .withMessage('Type "DELETE" to confirm account deletion!'),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        type: "error",
        errors: errors.array(),
      });
    }
    const userId = req.session.user.userId;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          type: "error",
          message: "User Not Found!",
        });
      }
      await Address.deleteMany({ userId });
      await Order.deleteMany({ userId });
      await User.deleteOne({ _id: userId });
      await deleteImages(user.profileImgPublicId);
      req.session.destroy((error) => {
        if (error) return next(error);
        res.clearCookie("connect.sid");
        return res.json({
          type: "success",
          message: "Account Deleted & Logged Out!",
          redirect: "/",
        });
      });
    } catch (error) {
      console.error("Account Deleting error:", error);
      return next(error);
    }
  },
];
/* ***********************************
               Exports
*********************************** */
module.exports = {
  getProfile,
  putEditProfile,
  getAddressBook,
  getAddressAdd,
  postAddressAdd,
  getAddressEdit,
  putAddressEdit,
  setDefaultAddress,
  deleteAddress,
  getPrivacySecurity,
  getFavourites,
  postFavourites,
  removeFromFavourites,
  getCart,
  postCart,
  updateCartQuantity,
  removeFromCart,
  getCheckout,
  checkoutValidations,
  postCheckout,
  getOrderSuccess,
  getMyOrders,
  getOrderTracking,
  postOrderTracking,
  putChangeEmail,
  putChangePassword,
  put2FactorAuth,
  postRevokeSession,
  postSignOutAll,
  DeleteAccountAndData,
};
