/* ***********************************
               Imports
*********************************** */
const mongoose = require("mongoose");
/* ***********************************
            Address Schema
*********************************** */
const addressSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    label: {
      type: String,
      enum: ["Home", "Office", "Other"],
      default: "Home",
    },
    fullName: {
      type: String,
      minlength: [3, "Name must be at least 3 characters!"],
      maxlength: [100, "Name cannot exceed 100 characters!"],
      required: [true, "Name is required!"],
    },
    phone: {
      type: String,
      minlength: [11, "Phone number must be at least 11 characters!"],
      maxlength: [14, "Phone number cannot exceed 14 characters!"],
      required: [true, "Phone number is required!"],
    },
    country: {
      type: String,
      enum: ["Pakistan"],
      required: [true, "Country is required!"],
      default: "Pakistan",
    },
    province: {
      type: String,
      enum: [
        "Punjab",
        "Sindh",
        "Khyber Pakhtunkhwa",
        "Balochistan",
        "Azad Kashmir",
        "Gilgit Baltistan",
      ],
      required: [true, "Province is required!"],
    },
    city: {
      type: String,
      minlength: [2, "City must be at least 2 characters!"],
      maxlength: [100, "City cannot exceed 100 characters!"],
      required: [true, "City is required!"],
    },
    postalCode: {
      type: String,
      minlength: [3, "Postal code must be at least 3 characters!"],
      maxlength: [10, "Postal code cannot exceed 10 characters!"],
      required: [true, "Postal code is required!"],
    },
    stateAddress: {
      type: String,
      minlength: [5, "Address must be at least 5 characters!"],
      maxlength: [200, "Address cannot exceed 200 characters!"],
      required: [true, "Address is required!"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
addressSchema.index(
  { userId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  },
);
/* ***********************************
               Exports
*********************************** */
module.exports = mongoose.model("Address", addressSchema);
