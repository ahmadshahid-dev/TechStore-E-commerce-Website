/* ***********************************
               Imports
*********************************** */
const mongoose = require("mongoose");
/* ***********************************
             ontact Schema
*********************************** */
const contactSchema = mongoose.Schema(
  {
    name: {
      type: String,
      minlength: [3, "Name must be at least 3 characters!"],
      maxlength: [100, "Name cannot exceed 100 characters!"],
      required: [true, "Name is required!"],
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required!"],
    },
    message: {
      type: String,
      minlength: [100, "Message must be at least 100 characters!"],
      maxlength: [5000, "Message cannot exceed 5000 characters!"],
      required: [true, "Message is required!"],
    },
  },
  { timestamps: true },
);
/* ***********************************
               Exports
*********************************** */
module.exports = mongoose.model("Contact", contactSchema);
