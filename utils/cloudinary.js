const { v2: cloudinary } = require("cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
// Presets for different image types;
const PRESETS = {
  products: [
    { width: 1600, height: 1600, crop: "limit" },
    { quality: "auto", fetch_format: "auto" },
  ],
  users: [
    { width: 400, height: 400, crop: "fill", gravity: "face" },
    { quality: "auto", fetch_format: "auto" },
  ],
};
// Uploads an image to Cloudinary and returns the URL and public ID;
exports.uploadImage = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `techstore/${folder}`,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: PRESETS[folder],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(file.buffer);
});
// Deletes one or more images from Cloudinary by their public IDs;
exports.deleteImages = async (publicIds) => {
  const ids = [].concat(publicIds).filter(Boolean);
  if (!ids.length) return;
  const results = await Promise.allSettled(
    ids.map((id) => cloudinary.uploader.destroy(id)),
  );
  results.forEach((r, i) => {
    if (r.status === "rejected")
      console.error(`Cloudinary delete failed (${ids[i]}):`, r.reason?.message);
  });
};
