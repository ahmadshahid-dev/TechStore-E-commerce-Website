// Escape special characters in a string to be used in a regular expression;
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
// Exports;
module.exports = escapeRegex;
