// Imports;
const User = require("../models/userModel");
const Address = require("../models/addressModel");
// Checkout........;
const getCheckoutData = async (sessionUser) => {
  const userId = sessionUser?.userId;
  const username = sessionUser?.username;
  if (!userId || !username) {
    return {
      status: 401,
      message: "Login Required!",
      redirect: "/auth/login",
    };
  }
  const user = await User.findById(userId)
    .populate("items.productId", "image name currentPrice")
    .select("items")
    .lean();
  if (!user) {
    return { status: 404, message: "User Not Found!" };
  }
  const cartItems = user.items
    .filter((item) => item.productId)
    .map((item) => ({
      image: item.productId.image,
      name: item.productId.name,
      currentPrice: item.productId.currentPrice,
      quantity: item.quantity,
    }));
  if (cartItems.length === 0) {
    return {
      status: 404,
      message: "Your cart is empty!",
      redirect: `/@${encodeURIComponent(username)}/cart`,
    };
  }
  const address = await Address.findOne({ userId, isDefault: true }).lean();
  if (!address) {
    return {
      status: 404,
      message: "Please Set Your Address Firstly!",
      redirect: `/@${encodeURIComponent(username)}/address-book`,
      returnToCheckout: true,
    };
  }
  return { status: 200, username, cartItems, address };
};
// Exports;
module.exports = { getCheckoutData };
