/* ***********************************
               Imports
*********************************** */
const mongoose = require("mongoose");
/* ***********************************
            Product Schema
*********************************** */
const productSchema = mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Image is requried!"],
    },
    pdpImage: {
      type: String,
      required: [true, "Pdp image is requried!"],
    },
    category: {
      type: String,
      index: true,
      enum: ["headphones", "keyboards", "mice"],
      required: [true, "Category is required!"],
    },
    name: {
      type: String,
      index: true,
      minlength: [10, "Name must be at least 10 characters!"],
      maxlength: [125, "Name cannot exceed 125 characters!"],
      required: [true, "Name is required!"],
    },
    color: {
      type: String,
      required: [true, "Color is required!"],
    },
    sku: {
      type: String,
      unique: true,
      uppercase: true,
      required: [true, "Sku is required!"],
    },
    currentPrice: {
      type: Number,
      min: [0, "Current price must be a non-negative number!"],
      required: [true, "Current price is required!"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price must be a non-negative number!"],
      required: [true, "Original price is required!"],
    },
    tag: {
      type: String,
      enum: ["Deal", "Best-Sell", "New", "Non"],
      required: [true, "Tag is required!"],
      default: "Non",
    },
    stockQuantity: {
      type: Number,
      min: [0, "Original price must be a non-negative number!"],
      required: [true, "Stock quantity is required!"],
    },
    status: {
      type: [String],
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    description: {
      type: String,
      minlength: [100, "Description must be at least 100 characters!"],
      required: [true, "Description is required!"],
    },
  },
  {
    timestamps: true,
  },
);
/* ***********************************
               Exports
*********************************** */
module.exports = mongoose.model("Product", productSchema);
