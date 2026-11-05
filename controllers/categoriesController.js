/* ***********************************
               Imports
*********************************** */
const path = require("path");
const Directory = require("../utils/util");
const Product = require("../models/productModel");
/* ***********************************
Website GET Headphones/Keyboards/Mice Controller
*********************************** */
const getCategoryProducts = (category, page) => {
  return async (req, res, next) => {
    try {
      const products = await Product.find({ category, status: "Active" })
        .select("image category name sku currentPrice originalPrice")
        .lean()
        .limit(10);
      res.render(path.join(Directory, `views/categories/${category}`), {
        currentPage: page,
        isLoggedIn: req.session.isLoggedIn,
        user: req.session.user,
        search: "",
        [category]: products,
      });
    } catch (error) {
      console.error(`${category} fetching error:`, error);
      return next(error);
    }
  };
};
/* ***********************************
Website GET PDP Controller
*********************************** */
const getPdp = async (req, res, next) => {
  const { category, sku } = req.params;
  const categories = ["headphones", "keyboards", "mice"];
  if (!categories.includes(category)) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Category!",
    });
  }
  if (!sku) {
    return res.status(400).json({
      type: "error",
      message: "Invalid Product!",
    });
  }
  try {
    const product = await Product.findOne({
      category,
      sku,
      status: "Active",
    }).lean();
    if (!product) {
      return res.status(404).json({
        type: "error",
        message: "Product Not Found!",
      });
    }
    const relatedProducts = await Product.find({
      category: product.category,
      status: "Active",
      _id: { $ne: product._id },
    })
      .select("image category name sku currentPrice originalPrice")
      .lean()
      .limit(4);
    res.render(path.join(Directory, "views/pages/pdp"), {
      currentPage: "Product Detail Page",
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
      search: "",
      product,
      relatedProducts,
    });
  } catch (error) {
    console.error("Product View fetching error:", error);
    return next(error);
  }
};
/* ***********************************
               Exports
*********************************** */
module.exports = {
  getHeadphones: getCategoryProducts("headphones", "Headphones"),
  getKeyboards: getCategoryProducts("keyboards", "Keyboards"),
  getMice: getCategoryProducts("mice", "Mice"),
  getPdp,
};
