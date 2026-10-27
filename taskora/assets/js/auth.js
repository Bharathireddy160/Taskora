import { auth, googleProvider, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, updateProfile, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const byId = (id) => document.getElementById(id);
const showMessage = (message, type = "error") => {
  const el = byId("form-message");
  if (!el) return;
  el.textContent = message;
  el.className = `form-message ${type}`;
};

async function saveProfile(user, name = "") {
  await setDoc(doc(db, "users", user.uid, "profile", "main"), {
    displayName: name || user.displayName || user.email?.split("@")[0] || "Student",
    email: user.email || "",
    updatedAt: serverTimestamp()
  }, { merge: true });
}

const loginForm = byId("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");
    const email = byId("email").value.trim();
    const password = byId("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      location.href = "dashboard.html";
    } catch (error) { showMessage(friendlyError(error)); }
  });
}

const signupForm = byId("signup-form");
if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage("");
    const name = byId("name").value.trim();
    const email = byId("email").value.trim();
    const password = byId("password").value;
    if (password.length < 6) return showMessage("Use a password with at least 6 characters.");
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      await saveProfile(result.user, name);
      location.href = "dashboard.html";
    } catch (error) { showMessage(friendlyError(error)); }
  });
}

document.querySelectorAll("[data-google-login]").forEach((button) => {
  button.addEventListener("click", async () => {
    showMessage("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveProfile(result.user);
      location.href = "dashboard.html";
    } catch (error) { showMessage(friendlyError(error)); }
  });
});

function friendlyError(error) {
  const messages = {
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use": "This email already has an account. Please log in.",
    "auth/weak-password": "Choose a stronger password (at least 6 characters).",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/unauthorized-domain": "Add this domain in Firebase Authentication → Settings → Authorized domains."
  };
  return messages[error.code] || error.message || "Something went wrong. Please try again.";
}

const logout = byId("logout-button");
if (logout) logout.addEventListener("click", async () => {
  await signOut(auth);
  location.href = "index.html";
});

onAuthStateChanged(auth, (user) => {
  const protectedPage = document.body.dataset.protected === "true";
  if (protectedPage && !user) location.href = "login.html";
  if (!protectedPage && user && ["login.html", "signup.html"].some(p => location.pathname.endsWith(p))) {
    location.href = "dashboard.html";
  }
});

import {
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// Show / Hide Password
const passwordInput = document.getElementById("password");
const togglePasswordButton =
  document.getElementById("toggle-password");

if (passwordInput && togglePasswordButton) {
  togglePasswordButton.addEventListener("click", () => {
    const isPasswordHidden = passwordInput.type === "password";

    passwordInput.type = isPasswordHidden ? "text" : "password";
    togglePasswordButton.textContent =
      isPasswordHidden ? "Hide" : "Show";

    togglePasswordButton.setAttribute(
      "aria-label",
      isPasswordHidden ? "Hide password" : "Show password"
    );

    togglePasswordButton.setAttribute(
      "aria-pressed",
      String(isPasswordHidden)
    );
  });
}

// Forgot Password
const forgotPasswordButton =
  document.getElementById("forgot-password-button");

const emailInput = document.getElementById("email");
const formMessage = document.getElementById("form-message");

if (forgotPasswordButton && emailInput && formMessage) {
  forgotPasswordButton.addEventListener("click", async () => {
    const email = emailInput.value.trim();

    if (!email) {
      formMessage.textContent =
        "Please enter your email address first.";
      formMessage.style.color = "#dc2626";
      emailInput.focus();
      return;
    }

    if (!emailInput.checkValidity()) {
      formMessage.textContent =
        "Please enter a valid email address.";
      formMessage.style.color = "#dc2626";
      emailInput.focus();
      return;
    }

    forgotPasswordButton.disabled = true;
    forgotPasswordButton.textContent = "Sending...";
    formMessage.textContent = "";

    try {
      await sendPasswordResetEmail(auth, email);

      formMessage.textContent =
        "If an account exists for this email, a password reset link will be sent. Please check your inbox and spam folder.";
      formMessage.style.color = "#15803d";
    } catch (error) {
      console.error("Password reset error:", error);

      if (
        error.code === "auth/invalid-email" ||
        error.code === "auth/missing-email"
      ) {
        formMessage.textContent =
          "Please enter a valid email address.";
      } else if (
        error.code === "auth/too-many-requests"
      ) {
        formMessage.textContent =
          "Too many attempts. Please try again later.";
      } else {
        formMessage.textContent =
          "Unable to send the reset email. Please try again later.";
      }

      formMessage.style.color = "#dc2626";
    } finally {
      forgotPasswordButton.disabled = false;
      forgotPasswordButton.textContent = "Forgot password?";
    }
  });
}
