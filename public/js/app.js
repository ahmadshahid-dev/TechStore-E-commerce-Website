// DOM Form Selection;
const contactForm = document.getElementById("contact-form");
const searchForm = document.getElementById("shopSrchForm");
const searchInput = document.getElementById("search-shop");
const productsContainer = document.getElementById("content-container");
const newsletterForm = document.getElementById("newsletter-form");
const logout = document.querySelectorAll(".logout");
/* ***********************************
               Contact
*********************************** */
async function postContact(event) {
  event.preventDefault();
  const form = event.target;
  const sendMsgBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (sendMsgBtn) {
    loadingSet(sendMsgBtn, "Sending...");
  }
  try {
    const response = await fetch("/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
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
      form.reset();
    }
  } catch (error) {
    console.error("Contact error:", error);
  } finally {
    if (sendMsgBtn) {
      loadingReset(sendMsgBtn, "Send Message");
    }
  }
}
/* ***********************************
         Search Suggestions
*********************************** */
let suggestionController = null;
async function getSearchSuggestions(
  query,
  searchForm,
  search,
  suggestionsList,
) {
  const trimmedQuery = query ? query.trim() : "";
  if (!trimmedQuery) {
    suggestionsList.classList.add("hidden");
    return;
  }
  if (suggestionController) {
    suggestionController.abort();
  }
  suggestionController = new AbortController();
  try {
    const response = await fetch(
      `/search/suggestions?query=${encodeURIComponent(trimmedQuery)}`,
      { signal: suggestionController.signal },
    );
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    const suggestions = await response.json();
    showSuggestions(suggestions, searchForm, search, suggestionsList);
  } catch (error) {
    if (error.name === "AbortError") return;
    console.error("Search suggestion error:", error);
  }
}
/* ***********************************
             Shop Search
*********************************** */
async function shopSearch(event) {
  event.preventDefault();
  try {
    const params = new URLSearchParams({
      search: searchInput.value.trim(),
    });
    const response = await fetch(`/shop?${params}`, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    const data = await response.json();
    responseIsNotOk(response, data);
    if (data.type === "success") {
      productsContainer.innerHTML = data.productHTML;
      checkRemainingProducts(data.countItems);
    }
  } catch (error) {
    console.error("Shop search error:", error);
  }
}
/* ***********************************
             Newsletter
*********************************** */
async function postNewsletter(event) {
  event.preventDefault();
  const form = event.target;
  const joinBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (joinBtn) {
    loadingSet(joinBtn, "Join...");
  }
  try {
    const response = await fetch("/news-letter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (response.status === 422) {
      form.querySelector("#errorNL-email").textContent = "";
      data.errors.forEach((error) => {
        const el = document.getElementById(`errorNL-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelector("#errorNL-email").textContent = "";
      showToast(data.message, data.type);
      form.reset();
    }
  } catch (error) {
    console.error("News letter error:", error);
  } finally {
    if (joinBtn) {
      loadingReset(joinBtn, "Join");
    }
  }
}
/* ***********************************
               Logout
*********************************** */
async function handleLogout() {
  try {
    const response = await fetch("/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    responseIsNotOk(response, data);
    if (data.type === "success") {
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Logout error:", error);
    showToast(error.message || "Something went wrong!");
  }
}
// DOM Event Handling;
contactForm?.addEventListener("submit", postContact);
searchForm?.addEventListener("submit", shopSearch);
newsletterForm?.addEventListener("submit", postNewsletter);
logout?.forEach((btn) => {
  btn.addEventListener("click", handleLogout);
});
