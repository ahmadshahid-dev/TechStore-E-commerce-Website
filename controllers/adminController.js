/* ***********************************
               Imports
*********************************** */
const path = require("path");
const {
  validateId,
  deleteUploadedImgs,
  deleteImages,
} = require("../utils/validate");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const { check, validationResult } = require("express-validator");
/* ***********************************
Website GET Admin Dashboard Controller
*********************************** */
const getDashboard = async (req, res, next) => {
  try {
    const [
      users,
      totalUsers,
      deliverdOrders,
      orders,
      totalOrders,
      totalProducts,
    ] = await Promise.all([
      User.find().sort({ createdAt: -1 }).limit(5).lean(),
      User.countDocuments(),
      Order.find({ orderStatus: "Delivered" }),
      Order.find().sort({ createdAt: -1 }).limit(5).lean(),
      Order.countDocuments({ orderStatus: "Delivered" }),
      Product.countDocuments({ status: "Active" }),
    ]);
    const totalRevenue = deliverdOrders.reduce(
      (sum, deliverdItem) => sum + deliverdItem.grandTotal,
      0,
    );
    res.render("admin/dashboard", {
      currentPage: "Dashboard",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      orders,
      users,
    });
  } catch (error) {
    console.error("Admin dashboard fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Admin Manage Products Controller
*********************************** */
const getManageProducts = async (req, res, next) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 10;
  const filter = req.query.category ? { category: req.query.category } : {};
  try {
    const [products, totalPrdcts] = await Promise.all([
      Product.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    res.render("admin/manage-products", {
      currentPage: "Manage Products",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      products,
      totalPrdcts,
      search: "",
    });
  } catch (error) {
    console.error("Manage products fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Admin Add Product Controller
*********************************** */
const getAddProduct = (req, res, next) => {
  res.render("admin/product-add-edit", {
    currentPage: "Add Product",
    isLoggedIn: req.session.isLoggedIn,
    user: req.session.user,
    editing: false,
    search: "",
  });
};
/* ***********************************
Website POST Admin Add Product Controller
*********************************** */
const postAddProduct = [
  check("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required!")
    .bail()
    .toLowerCase()
    .isIn(["headphones", "keyboards", "mice"])
    .withMessage("Invalid category!"),
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required!")
    .bail()
    .matches(/^[a-zA-Z0-9]+(?:[ '-][a-zA-Z0-9]+)*$/)
    .withMessage("Name contains invalid characters!")
    .bail()
    .isLength({ min: 10, max: 125 })
    .withMessage("Name must be 10-125 characters long!"),
  check("color").trim().notEmpty().withMessage("Color is required!"),
  check("sku")
    .trim()
    .notEmpty()
    .withMessage("Sku is required!")
    .bail()
    .toUpperCase()
    .custom(async (sku) => {
      const skuExists = await Product.exists({ sku });
      if (skuExists) {
        throw new Error("Sku already in use!");
      }
      return true;
    }),
  check("currentPrice")
    .trim()
    .notEmpty()
    .withMessage("Current price is required!")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Current price must be a non-negative number!"),
  check("originalPrice")
    .trim()
    .notEmpty()
    .withMessage("Original price is required!")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Original price must be a non-negative number!"),
  check("tag")
    .trim()
    .notEmpty()
    .withMessage("Tag is required!")
    .bail()
    .isIn(["Deal", "Best-Sell", "New", "Non"])
    .withMessage("Invaild Tag!"),
  check("stockQuantity")
    .trim()
    .notEmpty()
    .withMessage("Stock quantity is required!")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer!"),
  check("description")
    .notEmpty()
    .withMessage("Description is required!")
    .bail()
    .isLength({ min: 100 })
    .withMessage("Description must be at least 100 characters!"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await deleteUploadedImgs(req.files);
      return res.status(422).json({ type: "error", errors: errors.array() });
    }
    const {
      category,
      name,
      color,
      sku,
      currentPrice,
      originalPrice,
      tag,
      stockQuantity,
      description,
    } = req.body;
    try {
      const image = "products/" + req.files.image[0].filename;
      const pdpImage = "products/" + req.files.pdpImage[0].filename;
      await Product.create({
        image,
        pdpImage,
        category,
        name,
        color,
        sku,
        currentPrice,
        originalPrice,
        tag,
        stockQuantity,
        description,
      });
      return res.status(201).json({
        type: "success",
        message: "Product Added!",
        redirect: "/admin/manage-products",
      });
    } catch (error) {
      await deleteUploadedImgs(req.files);
      console.error("Add product error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website GET Admin Edit Product Controller
*********************************** */
const getEditProduct = async (req, res, next) => {
  const productId = req.params.id;
  if (!validateId(productId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid product!",
    });
  }
  const editing = req.query.editing === "true";
  try {
    const product = await Product.findById(productId).lean();
    if (!product) {
      return res.status(404).json({
        type: "error",
        message: "Product Not Found!",
      });
    }
    res.render("admin/product-add-edit", {
      currentPage: "Edit Product",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      editing,
      product,
    });
  } catch (error) {
    console.error("Edit product fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website PUT Admin Edit Product Controller
*********************************** */
const putEditProduct = [
  check("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required!")
    .bail()
    .toLowerCase()
    .isIn(["headphones", "keyboards", "mice"])
    .withMessage("Invalid category!"),
  check("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required!")
    .bail()
    .matches(/^[a-zA-Z0-9]+(?:[ '-][a-zA-Z0-9]+)*$/)
    .withMessage("Name contains invalid characters!")
    .bail()
    .isLength({ min: 10, max: 125 })
    .withMessage("Name must be 10-125 characters long!"),
  check("color").trim().notEmpty().withMessage("Color is required!"),
  check("sku")
    .trim()
    .notEmpty()
    .withMessage("Sku is required!")
    .bail()
    .toUpperCase()
    .custom(async (sku, { req }) => {
      const skuExists = await Product.exists({
        sku,
        _id: { $ne: req.body._id },
      });
      if (skuExists) {
        throw new Error("Sku already in use!");
      }
      return true;
    }),
  check("currentPrice")
    .trim()
    .notEmpty()
    .withMessage("Current price is required!")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Current price must be a non-negative number!"),
  check("originalPrice")
    .trim()
    .notEmpty()
    .withMessage("Original price is required!")
    .bail()
    .isFloat({ min: 0 })
    .withMessage("Original price must be a non-negative number!"),
  check("tag")
    .trim()
    .notEmpty()
    .withMessage("Tag is required!")
    .bail()
    .isIn(["Deal", "Best-Sell", "New", "Non"])
    .withMessage("Invaild Tag!"),
  check("stockQuantity")
    .trim()
    .notEmpty()
    .withMessage("Stock quantity is required!")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be a non-negative integer!"),
  check("description")
    .notEmpty()
    .withMessage("Description is required!")
    .bail()
    .isLength({ min: 100 })
    .withMessage("Description must be at least 100 characters!"),
  check("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required!")
    .bail()
    .isIn(["Active", "Inactive"])
    .withMessage("Invaild Status!"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await deleteUploadedImgs(req.files);
      return res.status(422).json({ type: "error", errors: errors.array() });
    }
    const {
      _id,
      category,
      name,
      color,
      sku,
      currentPrice,
      originalPrice,
      tag,
      stockQuantity,
      status,
      description,
    } = req.body;
    if (!validateId(_id)) {
      await deleteUploadedImgs(req.files);
      return res.status(400).json({
        type: "error",
        message: "Invalid product!",
      });
    }
    let saved = false;
    try {
      const product = await Product.findById(_id);
      if (!product) {
        await deleteUploadedImgs(req.files);
        return res.status(404).json({
          type: "error",
          message: "Product Not Found!",
        });
      }
      const newImage = req.files?.image?.[0];
      const oldImage = product.image;
      if (newImage) {
        product.image = `products/${newImage.filename}`;
      }
      const newPdpImage = req.files?.pdpImage?.[0];
      const oldPdpImage = product.pdpImage;
      if (newPdpImage) {
        product.pdpImage = `products/${newPdpImage.filename}`;
      }
      Object.assign(product, {
        category,
        name,
        color,
        sku,
        currentPrice,
        originalPrice,
        tag,
        stockQuantity,
        status,
        description,
      });
      await product.save();
      saved = true;
      if (newImage && oldImage) {
        const imagePath = path.join(Directory, "uploads", oldImage);
        await deleteImages(imagePath);
      }
      if (newPdpImage && oldPdpImage) {
        const imagePath = path.join(Directory, "uploads", oldPdpImage);
        await deleteImages(imagePath);
      }
      return res.status(200).json({
        type: "success",
        message: "Product Updated!",
        redirect: "/admin/manage-products",
      });
    } catch (error) {
      if (!saved) {
      await deleteUploadedImgs(req.files);
      }
      console.error("Updated product error:", error);
      return next(error);
    }
  },
];
/* ***********************************
Website DELETE Admin Product Controller
*********************************** */
const deleteProduct = async (req, res, next) => {
  const productId = req.params.id;
  if (!validateId(productId)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid product!",
    });
  }
  try {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({
        type: "error",
        message: "Product Not Found!",
      });
    }
    if (product.image) {
      const imagePath = path.join(Directory, "uploads", product.image);
      await deleteImages(imagePath);
    }
    if (product.pdpImage) {
      const pdpImagePath = path.join(Directory, "uploads", product.pdpImage);
      await deleteImages(pdpImagePath);
    }
    const productsCounting = await Product.countDocuments();
    return res.status(200).json({
      type: "success",
      message: "Product Deleted!",
      countItems: productsCounting,
    });
  } catch (error) {
    console.error("Product deleting error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Admin Manage Products Controller
*********************************** */
const getManageOrders = (req, res, next) => {
  try {
    res.render("admin/manage-orders", {
      currentPage: "Manage Orders",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
    });
  } catch (error) {
    console.error("Manage Orders fetching error:", error);
    return next(error);
  }
};
/* ***********************************
Website GET Admin Manage Products Controller
*********************************** */
const getManageUsers = (req, res, next) => {
  try {
    res.render("admin/manage-users", {
      currentPage: "Manage Users",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
    });
  } catch (error) {
    console.error("Manage Users fetching error:", error);
    return next(error);
  }
};
/* ***********************************
               Exports
*********************************** */
module.exports = {
  getDashboard,
  getAddProduct,
  postAddProduct,
  getManageProducts,
  getEditProduct,
  putEditProduct,
  deleteProduct,
  getManageOrders,
  getManageUsers,
};
