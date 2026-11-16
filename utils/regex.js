// Escape special characters in a string to be used in a regular expression;
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// Safe Local Redirect Utility;
function safeRedirectPath(value, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001F\u007F]/.test(value)) {
    return fallback;
  }
  try {
    const baseURL = "https://internal.invalid";
    const parsedURL = new URL(value, baseURL);
    if (parsedURL.origin !== baseURL) {
      return fallback;
    }
    return parsedURL.pathname + parsedURL.search + parsedURL.hash;
  } catch {
    return fallback;
  }
};
// Exports;
module.exports = {
  escapeRegex,
  safeRedirectPath
};
