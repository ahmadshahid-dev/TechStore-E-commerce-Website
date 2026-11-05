// Imports;
const fs = require("fs/promises");
const mongoose = require("mongoose");
// Validate Product;
exports.validateId = (Id) => {
  return !!Id && mongoose.Types.ObjectId.isValid(Id);
};
// Image & PdpImage Vaildation;
exports.imgsValidation = async (req, res, next) => {
  if (!req.files?.image?.length || !req.files?.pdpImage?.length) {
    await deleteUploadedImgs(req.files)
    return res.status(422).json({
      type: "error",
      errors: [
        { path: "image", msg: "Image is required!" },
        { path: "pdpImage", msg: "Pdp image is required!" },
      ],
    });
  }
  next();
};
// Delete Uploades Imgs;
exports.deleteUploadedImgs = async (files) => {
  if (!files || !Object.keys(files).length) return;
  await Promise.all(Object.values(files).flat().map(async ({ path }) => {
    if (!path) return;
    try {
      await fs.unlink(path);
    } catch (error) {
      console.error(`Failed to deleting ${path}:`, error.message);
    }
  }),
  );
};
// Delete Imgs;
exports.deleteImages = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Imgs deleting error:", error);
  }
};
// Only Fetch;
exports.onlyFetch = (req, res, next) => {
  if (req.get("X-Requested-With") !== "fetch") {
    return next("route");
  }
  next();
};
