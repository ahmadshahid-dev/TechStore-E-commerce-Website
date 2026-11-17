// Import;
const path = require("path");
const { csrfSync } = require("csrf-sync");
const Directory = path.join(__dirname, "..");
const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: (req) => req.headers["x-csrf-token"] || req.body?._csrf,
});
// Export;
module.exports = {
  Directory,
  csrfSynchronisedProtection,
  generateToken,
};
