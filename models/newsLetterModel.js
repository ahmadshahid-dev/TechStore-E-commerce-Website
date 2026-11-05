/* ***********************************
               Imports
*********************************** */
const mongoose = require("mongoose");
/* ***********************************
          News Letter Schema
*********************************** */
const newsLetterSchema = mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, "Email is required!"],
    },
  },
  { timestamps: true },
);
/* ***********************************
               Exports
*********************************** */
module.exports = mongoose.model("NewsLetter", newsLetterSchema);
