/* ***********************************
               Imports
*********************************** */
const mongoose = require("mongoose");
/* ***********************************
            User Schema
*********************************** */
const userSchema = mongoose.Schema(
  {
    profileImg: {
      type: String,
    },
    firstName: {
      type: String,
      minlength: [2, "First name must be at least 2 characters!"],
      maxlength: [50, "First name cannot exceed 50 characters!"],
    },
    lastName: {
      type: String,
      minlength: [2, "Last name must be at least 2 characters!"],
      maxlength: [50, "Last name cannot exceed 50 characters!"],
    },
    name: {
      type: String,
      minlength: [3, "Name must be at least 3 characters!"],
      maxlength: [100, "Name cannot exceed 100 characters!"],
      required: [true, "Name is required!"],
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      minlength: [3, "Username must be at least 2 characters!"],
      maxlength: [30, "Username cannot exceed 30 characters!"],
      required: [true, "Username is required!"],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Prefer not to say"],
      default: "Prefer not to say",
    },
    email: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      required: [true, "Email is required!"],
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: [true, "Role is required!"],
    },
    password: {
      type: String,
      minlength: [12, "Password must be at least 12 characters!"],
      maxlength: [72, "Password cannot exceed 72 characters!"],
      select: false,
      required: [true, "Password is required!"],
    },
    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    ],
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          required: [true, "Quantity is required!"],
        },
        price: {
          type: Number,
          min: 0,
        },
      },
    ],
    verificationStatus: {
      type: String,
      enum: ["Verified", "Unverified"],
      default: "Unverified",
      required: [true, "Verification Status is required!"],
    },
    resetPasswordToken: {
      type: String,
      select: false,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
      default: undefined,
    },
    sessionVersion: {
      type: Number,
      select: false,
      default: 0,
    },
    twoFctrVerification: {
      type: Boolean,
      select: false,
      defualt: false,
    },
    status: {
      type: String,
      enum: ["Active", "Block"],
      default: "Active",
    },
  },
  { timestamps: true },
);
/* ***********************************
               Exports
*********************************** */
module.exports = mongoose.model("User", userSchema);
