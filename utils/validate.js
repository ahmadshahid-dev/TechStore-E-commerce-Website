// Imports;
const fs = require("fs/promises");
const mongoose = require("mongoose");
// Validate Product;
exports.validateId = (Id) => {
  return !!Id && mongoose.Types.ObjectId.isValid(Id);
};
// Only Fetch;
exports.onlyFetch = (req, res, next) => {
  if (req.get("X-Requested-With") !== "fetch") {
    return next("route");
  }
  next();
};
