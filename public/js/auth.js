// DOM Form Selection;
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const F2OTPRecivedFrom = document.getElementById("2fOTPRecivedFrom");
const forgotForm = document.getElementById("forgot-form");
const resetForm = document.getElementById("reset-form");
/* ***********************************
                Signup
*********************************** */
async function handleSignup(event) {
  event.preventDefault();
  const form = event.target;
  const signupBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (signupBtn) {
    loadingSet(signupBtn, "Signing up...");
  }
  try {
    const response = await fetch("/auth/signup", {
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
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Signup error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (signupBtn) {
      loadingReset(signupBtn, "Create Account");
    }
  }
}
/* ***********************************
                Login
*********************************** */
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const loginBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (loginBtn) {
    loadingSet(loginBtn, "Logging in...");
  }
  try {
    const response = await fetch("/auth/login", {
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
      if (data.F2verification) {
        const modalDialog = document.getElementById("2fOTPModel");
        const f2closeTrigger = document.getElementById("2fCloseModel");
        if (modalDialog) {
          modalDialog.classList.remove("hidden");
          modalDialog.classList.add("flex");
          document.body.style.overflow = "hidden";
        }
        f2closeTrigger?.addEventListener("click", () => {
          modalDialog?.classList.add("hidden");
          modalDialog?.classList.remove("flex");
          document.body.style.overflow = "";
        });
        return;
      }
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Login error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (loginBtn) {
      loadingReset(loginBtn, "Sign In");
    }
  }
}
/* ***********************************
            2 Factor OTP
*********************************** */
async function handle2FactorOTP(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (submitBtn) {
    loadingSet(submitBtn, "Verifying...");
  }
  try {
    const response = await fetch("/auth/2Factor-OTP", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (authenticationCheck(response, data)) return;
    if (response.status === 422) {
      form.querySelector("#error-OTPCode").textContent = "";
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelector("#error-OTPCode").textContent = "";
      const modelDialog = document.getElementById("2fOTPModel");
      if (modelDialog) {
        modelDialog.classList.add("hidden");
        modelDialog.classList.remove("flex");
        document.body.style.overflow = "";
      }
      showToast(data.message, data.type);
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("2 Factor OTP error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (submitBtn) {
      loadingReset(submitBtn, "Verify OTP");
    }
  }
}
/* ***********************************
          Forgot Password
*********************************** */
async function handleForgotPassword(event) {
  event.preventDefault();
  const form = event.target;
  const forgotBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (forgotBtn) {
    loadingSet(forgotBtn, "Sending...");
  }
  try {
    const response = await fetch("/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const data = await response.json();
    if (response.status === 422) {
      form.querySelector("#error-email").textContent = "";
      data.errors.forEach((error) => {
        const el = document.getElementById(`error-${error.path}`);
        if (el) el.textContent = error.msg;
      });
      return;
    }
    responseIsNotOk(response, data);
    if (data.type === "success") {
      form.querySelector("#error-email").textContent = "";
      showToast(data.message, data.type);
      form.reset();
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (forgotBtn) {
      loadingReset(forgotBtn, "Send Recovery Email");
    }
  }
}
/* ***********************************
          Reset Password
*********************************** */
async function handleResetPassword(event, token) {
  event.preventDefault();
  const form = event.target;
  const resetBtn = form.querySelector("button[type='submit']");
  const formData = new FormData(form);
  if (resetBtn) {
    loadingSet(resetBtn, "Resetting...");
  }
  try {
    const response = await fetch(
      `/auth/reset-password/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      },
    );
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
      window.location.href = data.redirect;
    }
  } catch (error) {
    console.error("Reset password error:", error);
    showToast(error.message || "Something went wrong!");
  } finally {
    if (resetBtn) {
      loadingReset(resetBtn, "Reset Password");
    }
  }
}
// DOM Event Handling;
signupForm?.addEventListener("submit", handleSignup);
loginForm?.addEventListener("submit", handleLogin);
F2OTPRecivedFrom?.addEventListener("submit", handle2FactorOTP);
forgotForm?.addEventListener("submit", handleForgotPassword);
resetForm?.addEventListener("submit", (event) => {
  const token = resetForm.dataset.token;
  if (!token) {
    event.preventDefault();
    showToast("Invalid or expired reset link!");
    return;
  }
  handleResetPassword(event, token);
});
