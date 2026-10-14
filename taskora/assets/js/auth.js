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
