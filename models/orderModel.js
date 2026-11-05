/* ***********************************
               Imports
*********************************** */
const mongoose = require("mongoose");
// Random Unique Order Id Generator;
const orderId = () => {
  let result = "TS-";
  for (let i = 0; i < 7; i++) {
    result += Math.floor(Math.random() * 10);
  }
  return result;
};
/* ***********************************
             ontact Schema
*********************************** */
const orderSchema = mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      type: String,
      minlength: [10, "Order id must be at least 10 characters long!"],
      match: [
        /^[a-zA-Z0-9-]+$/,
        "Only letters, numbers, and hyphens are allowed!",
      ],
      default: orderId,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    orderEmail: {
      type: String,
      lowercase: true,
      required: [true, "Email is required!"],
    },
    items: [
      {
        image: {
          type: String,
          required: [true, "Image is required!"],
        },
        name: {
          type: String,
          required: [true, "Name is required!"],
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
          required: [true, "Quantity is required!"],
        },
        price: {
          type: Number,
          min: 0,
          required: [true, "Price is required!"],
        },
      },
    ],
    grandTotal: {
      type: Number,
      min: 0,
      required: [true, "Total Price is required!"],
    },
    address: {
      fullName: {
        type: String,
        required: [true, "Name is required!"],
      },
      phone: {
        type: String,
        required: [true, "Phone Number is required!"],
      },
      country: {
        type: String,
        required: [true, "Country is required!"],
      },
      province: {
        type: String,
        required: [true, "Province is required!"],
      },
      city: {
        type: String,
        required: [true, "City is required!"],
      },
      postalCode: {
        type: String,
        required: [true, "Postal Code is required!"],
      },
      stateAddress: {
        type: String,
        required: [true, "Address is required!"],
      },
    },
    shippingMethod: {
      type: String,
      enum: ["Standard", "Express"],
      default: "Standard",
    },
    paymentMethod: {
      type: String,
      enum: ["COD"],
      default: "COD",
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true },
);
/* ***********************************
               Exports
*********************************** */
module.exports = mongoose.model("Order", orderSchema);
