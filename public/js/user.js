// DOM Elements Selection;
const profileEditForm = document.getElementById("profileEditForm");
const addAddressForm = document.getElementById("addAddressForm");
const editAddressForm = document.getElementById("editAddressForm");
const deleteAddressBtns = document.querySelectorAll(".deleteAddressBtns");
const favBtns = document.querySelectorAll(".fav-btn");
const favBtn = document.getElementById("fav-btn");
const unFavBtns = document.querySelectorAll(".unfav-btn");
const unFavAllBtn = document.getElementById("unfavall-btn");
const cartForm = document.getElementById("cart-form");
const cartBtn = document.querySelectorAll(".cart-btn");
const removeCartBtns = document.querySelectorAll(".removeCartBtn");
const buyBtn = document.getElementById("buy-btn");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutForm = document.getElementById("checkout-form");
const orderTrackForm = document.getElementById("orderTrackForm");
const emailUpdateForm = document.getElementById("emailUpdateForm");
const passwordUpdateForm = document.getElementById("passwordUpdateForm");
const _2factorAuthForm = document.getElementById("2FactorAuthForm");
const sessionRevokeForms = document.querySelectorAll(".sessionRevokeForms");
const signOutAllBtn = document.getElementById("signOutAllBtn");
const accountDeletebtn = document.getElementById("accountDeletebtn");
/* ***********************************
           Update Profile
*********************************** */
async function updateProfile(event) {
  event.preventDefault();
  const form = event.target;
  const saveChangeBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (saveChangeBtn) {
    loadingSet(saveChangeBtn, "Updating...");
  }
  try {
    const response = await fetch("/profile-edit", {
      method: "PUT",
      body: formData,
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Update profile error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (saveChangeBtn) {
      loadingReset(saveChangeBtn, "Save Changes");
    }
  }
}
/* ***********************************
             Add Address
*********************************** */
async function handleAddAddress(event) {
  event.preventDefault();
  const form = event.target;
  const saveAddBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (saveAddBtn) {
    loadingSet(saveAddBtn, "Address Saving...");
  }
  try {
    const response = await fetch("/address-add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Add address error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (saveAddBtn) {
      loadingReset(saveAddBtn, "Save Address");
    }
  }
}
/* ***********************************
            Update Address
*********************************** */
async function handleEditAddress(event) {
  event.preventDefault();
  const form = event.target;
  const saveAddBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (saveAddBtn) {
    loadingSet(saveAddBtn, "Address Updating...");
  }
  try {
    const response = await fetch("/address-edit", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Edit address error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (saveAddBtn) {
      loadingReset(saveAddBtn, "Update Address");
    }
  }
}
/* ***********************************
          Set Default Address
*********************************** */
async function setDefaultAddress(event, addressId) {
  event.preventDefault();
  try {
    const response = await fetch(`/set-default-address/${addressId}`, {
      method: "POST",
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      updateDefaultAddress(addressId);
      showToast(data.message, data.type);
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    }
  } catch (error) {
    console.error("Set default address error:", error);
    showToast(error.message || "Something went wrong");
  }
}
/* ***********************************
            Delete Address
*********************************** */
async function handleDeleteAddress(event, btn, addressId) {
  event.preventDefault();
  if (btn) {
    loadingSet(btn, "Deleting...");
  }
  try {
    const response = await fetch(`/address-delete/${addressId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      document.getElementById(`address-${addressId}`).remove();
      showToast(data.message, data.type);
      checkRemainingProducts(data.countAddress);
    }
  } catch (error) {
    console.error("Delete Address error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (btn) {
      loadingReset(btn, "Delete");
    }
  }
}
/* ***********************************
          Add To Favourites
*********************************** */
async function addToFavourites(event, btn, productId) {
  event.preventDefault();
  if (favBtn) {
    loadingSet(favBtn, "Adding...");
  } else {
    loadingSet(btn);
  }
  try {
    const response = await fetch(`/favourites/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    showToast(data.message, data.type);
  } catch (error) {
    console.error("Add to favourites error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (favBtn) {
      loadingReset(favBtn, "Wishlist");
    } else {
      loadingReset(btn);
    }
  }
}
/* ***********************************
           Remove Favourites
*********************************** */
async function removeFromFavourites(event, btn, productId) {
  event.preventDefault();
  if (btn) {
    loadingSet(btn);
  }
  try {
    const response = await fetch(`/favourites/remove/${productId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      showToast(data.message, data.type);
      removeProduct(productId);
      checkRemainingProducts(data.countItems);
    }
  } catch (error) {
    console.error("Remove from favourites error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (btn) {
      loadingReset(btn);
    }
  }
}
/* ***********************************
              Add To Cart
*********************************** */
async function addToCart(event, btn, productId, quantity) {
  event.preventDefault();
  const form = event.target;
  const Cartbtn = form.querySelector("button[type='submit']") || btn;
  if (Cartbtn) {
    loadingSet(Cartbtn, "Adding to Cart...");
  } else {
    loadingSet(buyBtn, "Buying Now...");
  }
  try {
    const response = await fetch(`/cart/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    showToast(data.message, data.type);
  } catch (error) {
    console.error("Add to cart error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (Cartbtn) {
      loadingReset(Cartbtn, "Add to Cart");
    } else {
      loadingReset(buyBtn, "Buy Now");
    }
  }
}
/* ***********************************
        Update Cart Quantity
*********************************** */
async function updateCartQuantity(productId) {
  const quantity = document.getElementById(`qty-${productId}`).value;
  try {
    const response = await fetch(`/cart/quantity-update/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quantity }),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      updatingItemPricing(data.cartItems, data.cartUpdatedItem);
      showToast(data.message, data.type);
    }
  } catch (error) {
    console.error("Cart update quantity error:", error);
    showToast(error.message || "Something went wrong!");
  }
}
/* ***********************************
             Remove Cart
*********************************** */
async function removeFromCart(event, btn, productId) {
  event.preventDefault();
  if (btn) {
    loadingSet(btn);
  }
  try {
    const response = await fetch(`/cart/remove/${productId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      removeProduct(productId);
      showToast(data.message, data.type);
      checkRemainingProducts(data.countItems);
      updatingItemPricing(data.cartItems);
    }
  } catch (error) {
    console.error("Remove from cart error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (btn) {
      loadingReset(btn);
    }
  }
}
/* ***********************************
          Checkout Rendering
*********************************** */
async function getCheckout() {
  if (checkoutBtn) {
    loadingSet(checkoutBtn, "Checking Out...");
  }
  try {
    const response = await fetch("/checkout-validations", {
      method: "GET",
      headers: { "X-Requested-With": "fetch" },
    });
    const data = await response.json();
    if (data.type === "error") {
      showToast(data.message, data.type);
      if (data.redirect) {
        setTimeout(() => {
          window.location.href = data.redirect;
        }, 1000);
      }
      return;
    }
    responseIsNotOk(response, data);
    if (data.redirect) window.location.href = data.redirect;
  } catch (error) {
    console.error("Checkout fetching error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (checkoutBtn) {
      loadingReset(checkoutBtn, "Proceed to Checkout");
    }
  }
}
/* ***********************************
              Checkout
*********************************** */
async function postCheckout(event) {
  event.preventDefault();
  const form = event.target;
  const checkout = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (checkout) {
    loadingSet(checkout, "Order Placing...");
  }
  try {
    const response = await fetch("/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Checkout error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (checkout) {
      loadingReset(checkout, "Place Order (COD)");
    }
  }
}
/* ***********************************
             Order Track
*********************************** */
async function orderTrack(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const trackingPage = document.getElementById("tracking-page");
  const trackingResult = document.getElementById("tracking-result");
  trackingPage?.classList.add("h-[calc(100vh_-_75px)]");
  trackingResult.classList.add("hidden");
  try {
    const response = await fetch("/order-tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      trackingPage?.classList.remove("h-[calc(100vh_-_75px)]");
      trackingResult?.classList.remove("hidden");
      orderTrackUpdate(data.order);
      UIAddressUpdate(data.order.address);
    }
  } catch (error) {
    console.error("Order Tracking error:", error);
    showToast(error.message || "Something went wrong!");
  }
}
/* ***********************************
         Email Update/Change
*********************************** */
async function handleEmailUpdate(event) {
  event.preventDefault();
  const form = event.target;
  const emailSaveBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (emailSaveBtn) {
    loadingSet(emailSaveBtn, "Saving...");
  }
  try {
    const response = await fetch("/email-update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Email updating error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (emailSaveBtn) {
      loadingReset(emailSaveBtn, "Save New Email");
    }
  }
}
/* ***********************************
        Password Update/Change
*********************************** */
async function handlePasswordUpdate(event) {
  event.preventDefault();
  const form = event.target;
  const updateBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (updateBtn) {
    loadingSet(updateBtn, "Updating...");
  }
  try {
    const response = await fetch("/password-update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      showToast(data.message, data.type);
    }
  } catch (error) {
    console.error("Password updating error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (updateBtn) {
      loadingReset(updateBtn, "Update Password");
    }
  }
}
/* ***********************************
        2 Factor Authentication
*********************************** */
async function handle2FactorAuth(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const f2Toggle = document.getElementById("2FToggle");
  const verifyBtn = form.querySelector("button[type='submit']");
  if (verifyBtn) {
    loadingSet(verifyBtn, "Verifying...");
  }
  try {
    const response = await fetch("/2F-auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelector("#error-_2fctrCurntPaswrd").textContent = "";
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelector("#error-_2fctrCurntPaswrd").textContent = "";
      const modelDialog = document.getElementById("2FModel");
      if (modelDialog) {
        modelDialog.classList.add("hidden");
        modelDialog.classList.remove("flex");
        document.body.style.overflow = "";
      }
      if (data.checked === true) {
        f2Toggle.checked = true;
      } else {
        f2Toggle.checked = false;
      }
      showToast(data.message, data.type);
    }
  } catch (error) {
    console.error("2 Factor Auth error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (verifyBtn) {
      loadingReset(verifyBtn, "Verify & Activate");
    }
  }
}
/* ***********************************
        Session Revoke/Logout 
*********************************** */
async function handleSessionRevoke(event, sessionId) {
  event.preventDefault();
  try {
    const response = await fetch(`/session-revoke/${sessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      document.getElementById(`session-${sessionId}`)?.remove();
      showToast(data.message, data.type);
    }
  } catch (error) {
    console.error("Session Revoke error:", error);
    showToast(error.message || "Something went wrong!");
  }
}
/* ***********************************
         Sign Out All Sessions
*********************************** */
async function handleSignOutAll(event) {
  event.preventDefault();
  try {
    const response = await fetch("/sign-out-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      showToast(data.message, data.type);
      setTimeout(() => {
        window.location.href = data.redirect;
      }, 800);
    }
  } catch (error) {
    console.error("Sign Out All error:", error);
    showToast(error.message || "Something went wrong!");
  }
}
/* ***********************************
           Account Deleting
*********************************** */
async function handleDeleteAccount(event) {
  event.preventDefault();
  const Confirmation = document.getElementById("Confirmation").value;
  const deleteBtn = accountDeletebtn;
  if (deleteBtn) {
    loadingSet(deleteBtn, "Deleting...");
  }
  try {
    const response = await fetch("/account-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Confirmation }),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      document.getElementById("error-Confirmation").textContent = "";
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      document.getElementById("error-Confirmation").textContent = "";
      const modelDialog = document.getElementById("deleteModel");
      if (modelDialog) {
        modelDialog.classList.add("hidden");
        modelDialog.classList.remove("flex");
        document.body.style.overflow = "";
      }
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Account & Data Deleting error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (deleteBtn) {
      loadingReset(deleteBtn, "Confirm Delete");
    }
  }
}
// DOM Event Handling;
profileEditForm?.addEventListener("submit", updateProfile);
addAddressForm?.addEventListener("submit", handleAddAddress);
editAddressForm?.addEventListener("submit", handleEditAddress);
deleteAddressBtns?.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const addressId = btn.dataset.addressId;
    handleDeleteAddress(event, btn, addressId);
  });
});
favBtns?.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const productId = btn.dataset.productId;
    addToFavourites(event, btn, productId);
  });
});
favBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  const productId = favBtn.dataset.productId;
  addToFavourites(event, undefined, productId);
});
unFavBtns?.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const productId = btn.dataset.productId;
    removeFromFavourites(event, btn, productId);
  });
});
unFavAllBtn?.addEventListener("click", () => {
  unFavBtns?.forEach((btn) => {
    btn.click();
  });
});
cartForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const productId = cartForm.dataset.productId;
  const quantity = cartForm.quantity.value;
  addToCart(event, undefined, productId, quantity);
});
cartBtn?.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const productId = btn.dataset.productId;
    const quantity = 1;
    addToCart(event, btn, productId, quantity);
  });
});
removeCartBtns?.forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    const productId = btn.dataset.productId;
    removeFromCart(event, btn, productId);
  });
});
buyBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  const productId = cartForm.dataset.productId;
  const quantity = cartForm.quantity.value;
  addToCart(event, undefined, productId, quantity);
  setTimeout(() => {
    getCheckout();
  }, 1000);
});
checkoutBtn?.addEventListener("click", () => {
  getCheckout();
});
checkoutForm?.addEventListener("submit", postCheckout);
orderTrackForm?.addEventListener("submit", orderTrack);
emailUpdateForm?.addEventListener("submit", handleEmailUpdate);
passwordUpdateForm?.addEventListener("submit", handlePasswordUpdate);
_2factorAuthForm?.addEventListener("submit", handle2FactorAuth);
sessionRevokeForms?.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const sessionId = form.dataset.deviceId;
    handleSessionRevoke(event, sessionId);
  });
});
signOutAllBtn?.addEventListener("click", handleSignOutAll);
accountDeletebtn?.addEventListener("click", handleDeleteAccount);
