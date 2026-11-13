/* ***********************************
           Starter Loading
*********************************** */
window.addEventListener("load", () => {
  const loader = document.getElementById("page-loading");
  if (loader) {
    setTimeout(() => {
      loader.classList.add("opacity-0", "pointer-events-none");
      setTimeout(() => {
        loader.style.display = "none";
      }, 500);
    }, 200);
  }
});
/* ***********************************
        Navigation Menu Toggle;
*********************************** */
const navmenu = document.getElementById("navmenu");
const toggle = document.getElementById("toggle");
const bars = document.getElementById("bars");
const cross = document.getElementById("close");
const openMenu = () => {
  navmenu.classList.add("translate-x-0");
  bars.classList.add("hidden");
  cross.classList.remove("hidden");
  toggle.setAttribute("aria-expanded", "true");
  navmenu.setAttribute("aria-hidden", "false");
  document.body.classList.add("overflow-hidden");
};
const closeMenu = () => {
  navmenu.classList.remove("translate-x-0");
  bars.classList.remove("hidden");
  cross.classList.add("hidden");
  toggle.setAttribute("aria-expanded", "false");
  navmenu.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overflow-hidden");
};
toggle?.addEventListener("click", () => {
  const isOpen = navmenu.classList.contains("translate-x-0");
  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});
if (navmenu && toggle && bars && cross) {
  document.addEventListener("click", (e) => {
    if (navmenu.classList.contains("translate-x-0")) {
      if (!navmenu.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    }
  });
  navmenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navmenu.classList.contains("translate-x-0")) {
      closeMenu();
    }
  });
  window.addEventListener("resize", () => {
    if (
      window.innerWidth >= 1280 &&
      navmenu.classList.contains("translate-x-0")
    ) {
      closeMenu();
    }
  });
}
/* ***********************************
         Dropdown Menu Toggle
*********************************** */
const dropdownDesktop = document.getElementById("dropdownDesktop");
const dropdownListDesktop = document.getElementById("dropdownListDesktop");
const dropdownIconDesktop = document.getElementById("dropdownIconDesktop");
dropdownDesktop?.addEventListener("click", () => {
  dropdownListDesktop.classList.toggle("invisible");
  dropdownListDesktop.classList.toggle("opacity-0");
  dropdownIconDesktop.classList.toggle("rotate-180");
  dropdownIconDesktop.classList.toggle("transition-transform");
  const isOpen = !dropdownListDesktop.classList.contains("invisible")
    ? "true"
    : "false";
  dropdownDesktop.setAttribute("aria-expanded", isOpen);
});
if (dropdownDesktop && dropdownListDesktop && dropdownIconDesktop) {
  document.addEventListener("click", (e) => {
    if (
      !dropdownDesktop.contains(e.target) &&
      !dropdownListDesktop.contains(e.target)
    ) {
      dropdownListDesktop.classList.add("invisible", "opacity-0");
      dropdownIconDesktop.classList.remove("rotate-180");
      dropdownIconDesktop.classList.remove("transition-transform");
      dropdownDesktop.setAttribute("aria-expanded", "false");
    }
  });
}
/* ***********************************
        Dropdown Mobile Toggle
*********************************** */
const dropdownMobile = document.getElementById("dropdownMobile");
const dropdownListMobile = document.getElementById("dropdownListMobile");
const dropdownIconMobile = document.getElementById("dropdownIconMobile");
dropdownMobile?.addEventListener("click", () => {
  dropdownListMobile.classList.toggle("hidden");
  dropdownIconMobile.classList.toggle("rotate-180");
  dropdownIconMobile.classList.toggle("transition-transform");
  const isOpen = !dropdownListMobile.classList.contains("hidden")
    ? "true"
    : "false";
  dropdownMobile.setAttribute("aria-expanded", isOpen);
});
if (dropdownMobile && dropdownListMobile && dropdownIconMobile) {
  document.addEventListener("click", (e) => {
    if (
      !dropdownMobile.contains(e.target) &&
      !dropdownListMobile.contains(e.target)
    ) {
      dropdownListMobile.classList.add("hidden");
      dropdownIconMobile.classList.remove("rotate-180");
      dropdownIconMobile.classList.remove("transition-transform");
      dropdownMobile.setAttribute("aria-expanded", "false");
    }
  });
}
/* ***********************************
        Search && Suggestions
*********************************** */
const searchForms = document.querySelectorAll(".search-form");
searchForms?.forEach((searchForm) => {
  const searchId = searchForm.dataset.search;
  const suggestionsId = searchForm.dataset.suggestions;
  const search = searchForm.querySelector(`#${searchId}`);
  const suggestionsList = searchForm.querySelector(`#${suggestionsId}`);
  if (!search || !suggestionsList) return;
  let debounceTimer;
  search.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
    if (!query) {
      suggestionsList.textContent = "";
      suggestionsList.classList.add("hidden");
      return;
    }
    debounceTimer = setTimeout(() => {
      getSearchSuggestions(query, searchForm, search, suggestionsList);
    }, 300);
  });
  search.addEventListener("focus", () => {
    const query = search.value.trim();
    if (query && suggestionsList.children.length > 0) {
      suggestionsList.classList.remove("hidden");
    }
  });
  document.addEventListener("click", (e) => {
    if (!suggestionsList.contains(e.target) && !search.contains(e.target)) {
      suggestionsList.classList.add("hidden");
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      suggestionsList.classList.add("hidden");
    }
  });
});
function showNoResults(suggestionsList) {
  suggestionsList.innerHTML = `
    <li class="px-4 py-6 text-center text-slate-400 dark:text-slate-500 select-none">
      <svg class="h-6 w-6 mx-auto mb-1.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-xs font-inter font-medium">No products found</p>
    </li>
  `;
  suggestionsList.classList.remove("hidden");
}
function showSuggestions(suggestions, searchForm, search, suggestionsList) {
  suggestionsList.textContent = "";
  if (!suggestions || suggestions.length === 0) {
    showNoResults(suggestionsList);
    return;
  }
  suggestionsList.classList.remove("hidden");
  suggestions.forEach((product) => {
    const suggestionItem = document.createElement("li");
    suggestionItem.className =
      "text-slate-600 dark:text-slate-400 text-sm font-inter flex items-center justify-between rounded-xl py-2 px-3 mx-1.5 cursor-pointer select-none hover:bg-orange-50 dark:hover:bg-orange-950/40 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group";
    const suggestionText = document.createElement("span");
    suggestionText.className = "truncate mr-2 font-medium";
    suggestionText.textContent = product.name;
    const suggestionIcon = document.createElement("span");
    suggestionIcon.className =
      "flex-shrink-0 text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors";
    suggestionIcon.innerHTML = `
      <svg class="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 17V7h10"/>
        <path d="M17 17 7 7"/>
      </svg>
    `;
    suggestionItem.appendChild(suggestionText);
    suggestionItem.appendChild(suggestionIcon);
    suggestionItem.addEventListener("click", (event) => {
      search.value = product.name;
      suggestionsList.textContent = "";
      suggestionsList.classList.add("hidden");
      if (searchForm.id === "shopSrchForm") {
        shopSearch(event);
        return;
      }
      searchForm.submit();
    });
    suggestionsList.appendChild(suggestionItem);
  });
}
/* ***********************************
             Search Mobile
*********************************** */
const searchMobile = document.getElementById("search-mobile");
const searchBtn = document.getElementById("search-btn");
const closeSearch = document.getElementById("close-srch");
if (searchMobile && searchBtn && closeSearch) {
  searchBtn.addEventListener("click", () => {
    searchMobile.classList.remove("hidden");
    searchMobile.classList.add(
      "translate-y-0",
      "transition-transform",
      "ease-in-out",
      "duration-300",
    );
  });
  closeSearch.addEventListener("click", () => {
    searchMobile.classList.add("hidden");
    searchMobile.classList.remove(
      "translate-y-0",
      "transition-transform",
      "ease-in-out",
      "duration-300",
    );
  });
}
/* ***********************************
         Dropdown User Toggle
*********************************** */
const dropdownUser = document.getElementById("dropdownUser");
const dropdownListUser = document.getElementById("dropdownListUser");
dropdownUser?.addEventListener("click", () => {
  dropdownListUser.classList.toggle("invisible");
  dropdownListUser.classList.toggle("opacity-0");
  const isOpen = !dropdownListUser.classList.contains("invisible");
  dropdownUser.setAttribute("aria-expanded", isOpen ? "true" : "false");
});
if (dropdownUser && dropdownListUser) {
  document.addEventListener("click", (e) => {
    if (
      !dropdownUser.contains(e.target) &&
      !dropdownListUser.contains(e.target)
    ) {
      dropdownListUser.classList.add("invisible", "opacity-0");
      dropdownUser.setAttribute("aria-expanded", "false");
    }
  });
}
/* ***********************************
           Dark Mode Toggle
*********************************** */
const html = document.documentElement;
const mode = document.getElementById("mode");
const moon = document.getElementById("moon");
const sun = document.getElementById("sun");
function updateThemeUI(isDark) {
  if (isDark) {
    html.classList.add("dark");
    moon?.classList.add("hidden");
    sun?.classList.remove("hidden");
  } else {
    html.classList.remove("dark");
    sun?.classList.add("hidden");
    moon?.classList.remove("hidden");
  }
}
const savedTheme = localStorage.getItem("savedtheme");
const prefersDark = window.matchMedia("prefers-color-scheme: dark").matches;
const isDarkMode = savedTheme ? savedTheme === "dark" : prefersDark;
updateThemeUI(isDarkMode);
mode?.addEventListener("click", () => {
  const isNowDark = !html.classList.contains("dark");
  localStorage.setItem("savedtheme", isNowDark ? "dark" : "light");
  updateThemeUI(isNowDark);
});
/* ***********************************
         Password Eye Toggle
*********************************** */
const toggleButtons = document.querySelectorAll(".password-toggle");
toggleButtons?.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-target");
    const passwordInput = document.getElementById(targetId);
    const eyeOffIcon = button.querySelector(".eye-off");
    const eyeIcon = button.querySelector(".eye");
    if (!passwordInput) return;
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    if (eyeOffIcon && eyeIcon) {
      eyeOffIcon.classList.toggle("hidden", isPassword);
      eyeIcon.classList.toggle("hidden", !isPassword);
    }
    button.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password",
    );
  });
});
/* ***********************************
      Password Strength Checking
*********************************** */
const passwordInput =
  document.getElementById("password") || document.getElementById("newPassword");
passwordInput?.addEventListener("input", () => {
  const password = passwordInput.value;
  if (!password) return;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strength++;
  }
  const colors = ["bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const levels = ["Weak", "Fair", "Good", "Strong"];
  for (let i = 1; i <= 3; i++) {
    const bar = document.getElementById(`strength-${i}`);
    if (!bar) return;
    if (i <= strength) {
      bar.className = `flex-1 h-1 rounded-full transition-colors ${
        colors[Math.min(strength - 1, 3)]
      }`;
    } else {
      bar.className = "bg-gray-200 dark:bg-gray-700 h-1 flex-1 rounded-full";
    }
  }
  document.getElementById("strength-level").textContent =
    levels[Math.min(strength, 3)];
});
/* ***********************************
           Change PDP Imgs
*********************************** */
const changeImgBtns = document.querySelectorAll(".changeImgBtn");
changeImgBtns?.forEach((btn) => {
  btn.addEventListener("click", () => {
    const img = btn.querySelector(".Img");
    document.getElementById("pdpImage").src = img.src;
  });
});
/* ***********************************
      Quantity Adjustment In PDP
*********************************** */
const quantity = document.getElementById("quantity");
const plusPdp = document.getElementById("plus-pdp");
const minusPdp = document.getElementById("minus-pdp");
plusPdp?.addEventListener("click", () => {
  if (!quantity) return;
  if (quantity.value < 10) {
    quantity.value = Number(quantity.value) + 1;
  }
});
minusPdp?.addEventListener("click", () => {
  if (!quantity) return;
  if (quantity.value > 1) {
    quantity.value = Number(quantity.value) - 1;
  }
});
/* ***********************************
           Images Previews
*********************************** */
const imageInput = document.getElementById("image");
const pdpImgInput = document.getElementById("pdpImage");
const profileInput = document.getElementById("profileImg");
function previewImage(event, previewId, previewEmptyId) {
  const file = event.target.files[0];
  if (file) {
    const previewEmpty = document.getElementById(previewEmptyId);
    const preview = document.getElementById(previewId);
    if (previewEmpty && preview) {
      previewEmpty.classList.add("hidden");
      preview.classList.remove("hidden");
    }
    preview.src = URL.createObjectURL(file);
  }
}
if ((imageInput && pdpImgInput) || profileInput) {
  imageInput?.addEventListener("change", (event) => {
    previewImage(event, "imagePreview", "imgPreviewEmpty");
  });
  pdpImgInput?.addEventListener("change", (event) => {
    previewImage(event, "pdpImagePreview", "pdpPreviewEmpty");
  });
  profileInput?.addEventListener("change", (event) => {
    previewImage(event, "profilePreview", "profilePreviewEmpty");
  });
}
/* ***********************************
             Cart Quantity
*********************************** */
const plusCartQuantity = document.querySelectorAll(".plusCartQuantity");
const minusCartQuantity = document.querySelectorAll(".minusCartQuantity");
plusCartQuantity?.forEach((plusQuantity) => {
  plusQuantity.addEventListener("click", () => {
    const itemId = plusQuantity.dataset.itemId;
    const quantity = document.getElementById(`qty-${itemId}`);
    if (!quantity) return;
    if (quantity.value < 10) {
      quantity.value = Number(quantity.value) + 1;
      updateCartQuantity(itemId);
    }
  });
});
minusCartQuantity?.forEach((minusQuantity) => {
  minusQuantity.addEventListener("click", () => {
    const itemId = minusQuantity.dataset.itemId;
    const quantity = document.getElementById(`qty-${itemId}`);
    if (!quantity) return;
    if (quantity.value > 1) {
      quantity.value = Number(quantity.value) - 1;
      updateCartQuantity(itemId);
    }
  });
});
/* ***********************************
        Updating Item Pricing
*********************************** */
const updatingItemPricing = (cartItems, cartUpdatedItem) => {
  if (!cartItems) return;
  if (cartUpdatedItem) {
    const item = cartItems.find(
      (item) => item._id === cartUpdatedItem.productId,
    );
    if (!item) return;
    item.quantity = cartUpdatedItem.quantity;
    const itemSubTotal = item.currentPrice * item.quantity;
    const itemSubTotalTxt = document.getElementById(`item-${item._id}`);
    itemSubTotalTxt.textContent = itemSubTotal.toLocaleString();
  }
  const itemsSubTotalTxt = document.getElementById("itemsSubTotalTxt");
  const itemsTotalSavingsTxt = document.getElementById("itemsTotalSavingsTxt");
  const itemsGrandTotalTxt = document.getElementById("itemsGrandTotalTxt");
  let itemsSubTotal = 0;
  let itemsTotalSavings = 0;
  const shipping = 200;
  cartItems.forEach((item) => {
    itemsSubTotal += item.currentPrice * item.quantity;
    itemsTotalSavings +=
      item.quantity * (item.originalPrice - item.currentPrice);
  });
  const itemsGrandTotal = itemsSubTotal + shipping;
  itemsSubTotalTxt.textContent = itemsSubTotal.toLocaleString();
  itemsTotalSavingsTxt.textContent = itemsTotalSavings.toLocaleString();
  itemsGrandTotalTxt.textContent = itemsGrandTotal.toLocaleString();
};
/* ***********************************
          Update Default Tag
*********************************** */
const defaultTags = document.querySelectorAll(".defaultTags");
const updateDefaultTag = (addressId) => {
  defaultTags.forEach((defaultTag) => {
    const isDefault = defaultTag.dataset.addressId === addressId;
    defaultTag.innerHTML = isDefault
      ? `<span class="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/40 inline-flex items-center gap-1.5 rounded-full py-1 px-2.5">
      <span class="bg-emerald-500 h-1.5 w-1.5 rounded-full"></span>
      <span class="text-[0.6875rem] font-montserrat font-bold uppercase tracking-wider">Default</span>
      </span>`
      : "";
  });
};
/* ***********************************
        Update Default Address
*********************************** */
function updateDefaultAddress(addressId) {
  const forms = document.querySelectorAll(".default-address-form");
  forms.forEach((form) => {
    const currentAddressId = form.dataset.addressId;
    const checkbox = form.querySelector("input[type=checkbox]");
    const label = form.querySelector("label");
    if (!checkbox || !label) return;
    const isDefault = currentAddressId === addressId;
    checkbox.checked = isDefault;
    checkbox.disabled = isDefault;
    label.className = isDefault
      ? "text-emerald-600 dark:text-emerald-400 text-xs font-montserrat font-bold cursor-pointer"
      : "text-slate-600 dark:text-slate-400 text-xs font-inter font-medium cursor-pointer";
    label.textContent = isDefault
      ? "Active Default Address"
      : "Set as Default Address";
    updateDefaultTag(addressId);
  });
}
/* ***********************************
            Delivery Method
*********************************** */
const standardDelivery = document.getElementById("Standard");
const expressDelivery = document.getElementById("Express");
expressDelivery?.addEventListener("click", () => {
  expressDelivery.checked = true;
  if (expressDelivery.checked === true) {
    const subTotalTxt = document.getElementById("subTotal");
    const subTotal = Number(subTotalTxt.dataset.subTotal);
    const shippingTxt = document.getElementById("shipping");
    const shipping = Number(shippingTxt.dataset.shipping) + 300;
    const grandTotalTxt = document.getElementById("grandTotal");
    const grandTotal = subTotal + shipping;
    shippingTxt.textContent = shipping;
    grandTotalTxt.textContent = grandTotal.toLocaleString();
  }
});
standardDelivery?.addEventListener("click", () => {
  standardDelivery.checked = true;
  if (standardDelivery.checked === true) {
    const subTotalTxt = document.getElementById("subTotal");
    const subTotal = Number(subTotalTxt.dataset.subTotal);
    const shippingTxt = document.getElementById("shipping");
    const shipping = Number(shippingTxt.dataset.shipping);
    const grandTotalTxt = document.getElementById("grandTotal");
    const grandTotal = subTotal + shipping;
    shippingTxt.textContent = shipping;
    grandTotalTxt.textContent = grandTotal.toLocaleString();
  }
});
/* ***********************************
          Smooth Scrolling
*********************************** */
function scrollToSection(id) {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
    });
  }
  updateActiveTab(id);
}
/* ***********************************
          Active Tabs Update
*********************************** */
function updateActiveTab(id) {
  document.querySelectorAll(".sec-tab-btn").forEach((btn) => {
    btn.className =
      "sec-tab-btn bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-montserrat font-semibold border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer whitespace-nowrap py-2.5 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 hover:transition hover:ease-out hover:duration-[250ms]";
  });
  const activeBtn = document.getElementById(`tab-${id}`);
  if (activeBtn) {
    if (id === "sec-danger") {
      activeBtn.className =
        "sec-tab-btn bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-montserrat font-bold border border-rose-200/60 dark:border-rose-500/20 rounded-xl cursor-pointer py-2.5 px-4 hover:bg-rose-100 dark:hover:bg-rose-800  whitespace-nowrap hover:transition hover:ease-out hover:duration-[250ms]";
    } else {
      activeBtn.className =
        "sec-tab-btn bg-orange-600 text-white text-xs font-montserrat font-bold whitespace-nowrap rounded-xl shadow-md shadow-orange-600/20 cursor-pointer py-2.5 px-4 transition ease-out duration-[250ms]";
    }
  }
}
/* ***********************************
             Show Toast
*********************************** */
function showToast(message, type = "error") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className =
      "flex flex-col items-end gap-y-1.5 fixed bottom-5 right-5 z-[9999]";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 max-w-sm flex items-center gap-x-2.5 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md py-2.5 px-4.5 opacity-0 translate-y-3 transition ease-out duration-300 select-none`;
  const svg = document.createElement("div");
  const msg = document.createElement("p");
  const close = document.createElement("button");
  msg.className = `text-xs font-inter leading-snug flex-1`;
  close.className = `text-slate-400 text-xs font-medium ml-1.5 focus:outline-none cursor-pointer hover:text-slate-600 dark:hover:text-slate-200`;
  close.type = "button";
  close.setAttribute("aria-label", "Close");
  close.textContent = "✕";
  if (type === "success") {
    svg.innerHTML = `
      <div class="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600
    dark:text-emerald-400 h-7 w-7 flex items-center justify-center rounded-xl">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round"
      stroke-width="2.5" d="M5 13l4 4L19 7" /></svg></div>
    `;
  } else if (type === "info") {
    svg.innerHTML = `
      <div class="bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 
      h-7 w-7 flex items-center justify-center rounded-xl">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round"
      stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </div>
    `;
  } else {
    svg.innerHTML = `
      <div class="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 
      h-7 w-7 flex items-center justify-center rounded-xl">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round"
      stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
    `;
  }
  msg.textContent = message;
  toast.append(svg, msg, close);
  document.getElementById("toast-container").appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-y-3");
    toast.classList.add("opacity-100", "translate-y-0");
  });
  close.addEventListener("click", () => hideToast(toast));
  const timeout = setTimeout(() => {
    hideToast(toast);
  }, 3000);
  function hideToast(toast) {
    clearTimeout(timeout);
    toast.classList.remove("opacity-100", "translate-y-0");
    toast.classList.add("opacity-0", "translate-y-3");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}
/* ***********************************
           Response Not Ok
*********************************** */
const responseIsNotOk = (response, data) => {
  if (!response.ok) {
    throw new Error(data.message || "Request failed!");
  }
  return;
};
/* ***********************************
       Authentication Checking
*********************************** */
const authenticationCheck = (response, data) => {
  if (response.status === 401) {
    showToast(data.message, data.type);
    setTimeout(() => {
      window.location.href = data.redirect;
    }, 1500);
    return true;
  }
  return false;
};
/* ***********************************
            Remove Product
*********************************** */
const removeProduct = (productId) => {
  const product = document.getElementById(`product-${productId}`);
  if (product) {
    product.remove();
  }
};
/* ***********************************
          UI Address Update
*********************************** */
const UIAddressUpdate = (address) => {
  const fullName = document.getElementById("fullName");
  const stateAddress = document.getElementById("stateAddress");
  const prvinceCtyPstlCd = document.getElementById("prvinceCtyPstlCd");
  if (!fullName || !stateAddress || !prvinceCtyPstlCd) return;
  if (!address) return;
  fullName.textContent = address.fullName || "";
  stateAddress.textContent = address.stateAddress || "";
  prvinceCtyPstlCd.textContent = [
    address.city,
    address.province,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
};
/* ***********************************
          UI Address Update
*********************************** */
const orderTrackUpdate = (order) => {
  const orderNoId = document.getElementById("orderNoId");
  const DeliveryInfo = document.getElementById("DeliveryInfo");
  if (!orderNoId || !DeliveryInfo) return;
  if (!order) return;
  orderNoId.textContent = order.orderId || "";
  DeliveryInfo.textContent =
    order.shippingMethod === "Express"
      ? "24-48 Hours"
      : "3-5 Business Days" || "";
};
/* ***********************************
          Remaining Products
*********************************** */
const checkRemainingProducts = (countItems) => {
  const ContentContainer = document.getElementById("content-container");
  const favBenefits = document.getElementById("fav-benefits");
  const countItemsContent = document.getElementById("countItemsBar");
  const itemsCount = document.getElementById("items-count");
  const emptyState = document.getElementById("empty");
  const NoMatch = document.getElementById("no-matches");
  const countText = document.getElementById("countText");
  if (itemsCount) {
    itemsCount.textContent = countItems;
  }
  if (countText) {
    countText.textContent = countItems === 1 ? "Item" : "Items";
  }
  if (countItems > 0) {
    countItemsContent?.classList.remove("hidden");
    emptyState?.classList.add("hidden");
    NoMatch?.classList.add("hidden");
    ContentContainer?.classList.remove("hidden");
    favBenefits?.classList.remove("hidden");
  } else {
    countItemsContent?.classList.add("hidden");
    emptyState?.classList.remove("hidden");
    NoMatch?.classList.remove("hidden");
    ContentContainer?.classList.add("hidden");
    favBenefits?.classList.remove("hidden");
  }
};
/* ***********************************
        Category Chips/Badges
*********************************** */
const categoryChips = document.querySelectorAll(".category-chip");
categoryChips.forEach((chip) => {
  chip.addEventListener("click", (event) => {
    event.preventDefault();
    const category = chip.getAttribute("data-category") || "All";
    categoryChips.forEach((chip) => {
      chip.className =
        "category-chip bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-montserrat font-semibold whitespace-nowrap cursor-pointer border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 hover:transition hover:ease-out hover:duration-[250ms]";
    });
    chip.className =
      "category-chip active-chip bg-orange-600 text-white text-xs font-montserrat font-bold whitespace-nowrap cursor-pointer rounded-xl shadow-sm shadow-orange-600/25 py-2 px-4";
    filterCategory(category);
  });
});
/* ***********************************
         Category Filteration
*********************************** */
function filterCategory(category) {
  let products = document.querySelectorAll(".product-item");
  if (products.length === 0) {
    products = document.querySelectorAll(".product-card");
  }
  let visibleCount = 0;
  products.forEach((product) => {
    const attributeCategory =
      product.getAttribute("data-category") || product.dataset.category || "";
    const prdctCatgoryBadge =
      product.querySelector("span")?.textContent.trim() || "";
    const productCategory = attributeCategory || prdctCatgoryBadge;
    if (category === "All" || productCategory.includes(category)) {
      product.style.display = "block";
      visibleCount++;
    } else {
      product.style.display = "none";
    }
  });
  checkRemainingProducts(visibleCount);
}
/* ***********************************
         Reset Category Chips
*********************************** */
function resetCategoryChips() {
  categoryChips.forEach((chip) => {
    const isAll = chip.dataset.category === "All";
    chip.className = isAll
      ? "category-chip active-chip bg-orange-600 text-white text-xs font-montserrat font-bold whitespace-nowrap cursor-pointer rounded-xl shadow-sm shadow-orange-600/25 py-2 px-4"
      : "category-chip bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-montserrat font-semibold whitespace-nowrap cursor-pointer border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 hover:transition hover:ease-out hover:duration-[250ms]";
  });
  filterCategory("All");
}
/* ***********************************
             Clear Filters
*********************************** */
const clearFilterBtn = document.getElementById("clearFilterBtn");
clearFilterBtn?.addEventListener("click", async (event) => {
  event.preventDefault();
  searchInput.value = "";
  await shopSearch(event);
  resetCategoryChips();
});
/* ***********************************
           Products Sorting
*********************************** */
function sortProducts(criteria) {
  const grid = document.getElementById("content-container");
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll(".product-item"));
  cards.sort((a, b) => {
    const priceA = parseFloat(a.getAttribute("data-price")) || 0;
    const priceB = parseFloat(b.getAttribute("data-price")) || 0;
    const nameA = a.getAttribute("data-name") || "";
    const nameB = b.getAttribute("data-name") || "";
    if (criteria === "price-low") return priceA - priceB;
    if (criteria === "price-high") return priceB - priceA;
    if (criteria === "name") return nameA.localeCompare(nameB);
    return 0;
  });
  cards.forEach((card) => grid.appendChild(card));
}
const sortSelect = document.getElementById("sort-select");
sortSelect?.addEventListener("change", (event) => {
  const value = event.target.value;
  sortProducts(value);
});
/* ***********************************
            Model Dialogs
*********************************** */
const openTriggers = document.querySelectorAll(".openTrigger");
openTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const tragetId = trigger.dataset.model;
    const modelDialog = document.getElementById(tragetId);
    if (!modelDialog) return;
    modelDialog.classList.remove("hidden");
    modelDialog.classList.add("flex");
    document.body.style.overflow = "hidden";
    const closeTrigger = document.querySelector(".closeTrigger");
    const cancelTrigger = modelDialog.querySelector(".cancelTrigger");
    if (!closeTrigger || !closeTrigger) return;
    function closeModel() {
      modelDialog.classList.add("hidden");
      modelDialog.classList.remove("flex");
      document.body.style.overflow = "";
      const f2Toggle = document.getElementById("2FToggle");
      if (f2Toggle) {
        const checked = f2Toggle.dataset.checked;
        if (checked === "true") {
          f2Toggle.checked = true;
        } else {
          f2Toggle.checked = false;
        }
      }
    }
    closeTrigger?.addEventListener("click", closeModel);
    cancelTrigger?.addEventListener("click", closeModel);
    modelDialog?.addEventListener("click", (e) => {
      if (e.target === modelDialog) closeModel();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modelDialog.classList.contains("hidden")) {
        closeModel();
      }
    });
  });
});
/* ***********************************
          Confirm Delegation
*********************************** */
const deleteConfirmInput = document.getElementById("Confirmation");
const confirmDeleteBtn = document.getElementById("accountDeletebtn");
deleteConfirmInput?.addEventListener("input", (e) => {
  if (e.target.value.trim() === "DELETE") {
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.classList.remove("opacity-40", "cursor-not-allowed");
    confirmDeleteBtn.classList.add("cursor-pointer", "hover:bg-rose-700");
  } else {
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.classList.add("opacity-40", "cursor-not-allowed");
    confirmDeleteBtn.classList.remove("cursor-pointer", "hover:bg-rose-700");
  }
});
/* ***********************************
          Buttons Loading Set
*********************************** */
function loadingSet(btn, loadingText) {
  if (!btn) return;
  btn.disabled = true;
  btn.querySelector(".Icon")?.classList.add("hidden");
  btn.querySelector(".Spinner").classList.remove("hidden");
  if (!loadingText) return;
  btn.querySelector(".Text").textContent = loadingText;
}
/* ***********************************
        Buttons Loading Reset
*********************************** */
function loadingReset(btn, defualtText) {
  if (!btn) return;
  btn.disabled = false;
  btn.querySelector(".Icon")?.classList.remove("hidden");
  btn.querySelector(".Spinner").classList.add("hidden");
  if (!defualtText) return;
  btn.querySelector(".Text").textContent = defualtText;
}
