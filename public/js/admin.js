// DOM Form Selection;
const prdctAddForm = document.getElementById("prdctAddForm");
const prdctEditForm = document.getElementById("prdctEditForm");
const prdctDeleteBtn = document.getElementById("prdctDeleteBtn");
/* ***********************************
             Add Product
*********************************** */
async function handleAddProduct(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const prdctAddBtn = form.querySelector("button[type='submit']");
  if (prdctAddBtn) {
    loadingSet(prdctAddBtn, "Publishing...");
  }
  try {
    const response = await fetch("/admin/product-add", {
      method: "POST",
      headers: {
        "X-Requested-With": "fetch",
        "x-csrf-token": getCsrf(),
      },
      body: formData,
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
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Add product save error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (prdctAddBtn) {
      loadingReset(prdctAddBtn, "Publish Product");
    }
  }
}
/* ***********************************
           Update Product
*********************************** */
async function handleUpdateProduct(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const prdctUpdateBtn = form.querySelector("button[type='submit']");
  if (prdctUpdateBtn) {
    loadingSet(prdctUpdateBtn, "Updating...");
  }
  try {
    const response = await fetch("/admin/product-edit", {
      method: "PUT",
      headers: {
        "X-Requested-With": "fetch",
        "x-csrf-token": getCsrf(),
      },
      body: formData,
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
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Updated product error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (prdctUpdateBtn) {
      loadingReset(prdctUpdateBtn, "Update Product");
    }
  }
}
/* ***********************************
            Delete Product
*********************************** */
async function handleDeleteProduct(event, productId) {
  event.preventDefault();
  if (prdctDeleteBtn) {
    loadingSet(prdctDeleteBtn, "Deleting...");
  }
  try {
    const response = await fetch(`/admin/product-delete/${productId}`, {
      method: "DELETE",
      headers: jsonHeaders(),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      const modelDialog = document.getElementById("deleteModel");
      if (modelDialog) {
        modelDialog.classList.add("hidden");
        modelDialog.classList.remove("flex");
        document.body.style.overflow = "";
      }
      removeProduct(productId);
      showToast(data.message, data.type);
      checkRemainingProducts(data.countItems);
    }
  } catch (error) {
    console.error("Product deleting error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (prdctDeleteBtn) {
      loadingReset(prdctDeleteBtn, "Yes, Delete");
    }
  }
}
// DOM Event Handling;
prdctAddForm?.addEventListener("submit", (event) => {
  handleAddProduct(event);
});
prdctEditForm?.addEventListener("submit", (event) => {
  handleUpdateProduct(event);
});
prdctDeleteBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  const productId = prdctDeleteBtn.dataset.productId;
  if (!productId) {
    showToast("Product Not Found!");
    return;
  }
  handleDeleteProduct(event, productId);
});
