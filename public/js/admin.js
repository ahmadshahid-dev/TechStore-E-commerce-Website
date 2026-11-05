// DOM Form Selection;
const prdctAddForm = document.getElementById("prdctAddForm");
const prdctEditForm = document.getElementById("prdctEditForm");
const prdctDeleteForm = document.querySelectorAll(".productDelete-form");
/* ***********************************
             Add Product
*********************************** */
async function handleAddProduct(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const addBtn = form.querySelector("button[type='submit']");
  if (addBtn) {
    addBtn.disabled = true;
    addBtn.textContent = "Product Publishing...";
  }
  try {
    const response = await fetch("/admin/product-add", {
      method: "POST",
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
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.innerHTML = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Publish Product`;
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
  const editBtn = form.querySelector("button[type='submit']");
  if (editBtn) {
    editBtn.disabled = true;
    editBtn.textContent = "Product Updating...";
  }
  try {
    const response = await fetch("/admin/product-edit", {
      method: "PUT",
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
    if (editBtn) {
      editBtn.disabled = false;
      editBtn.innerHTML = `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Update Product`;
    }
  }
}
/* ***********************************
            Delete Product
*********************************** */
async function handleDeleteProduct(event, productId) {
  event.preventDefault();
  const form = event.target;
  const deleteBtn = form.querySelector("button[type='submit']");
  if (deleteBtn) {
    deleteBtn.disabled = true;
  }
  try {
    const response = await fetch(`/admin/product-delete/${productId}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    responseIsNotOk(response, data);
    if (data.type === "success") {
      removeProduct(productId);
      showToast(data.message, data.type);
      checkRemainingProducts(data.countItems);
    }
  } catch (error) {
    console.error("Product deleting error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (deleteBtn) {
      deleteBtn.disabled = false;
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
prdctDeleteForm.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const productId = form.dataset.productId;
    if (!productId) {
      showToast("Product Not Found!");
      return;
    }
    handleDeleteProduct(event, productId);
  });
});
