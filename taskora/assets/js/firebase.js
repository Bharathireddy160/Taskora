import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCrsK0aG08f3wyH7zvDNOaflTlaaYqhf6k",
  authDomain: "taskora-5b226.firebaseapp.com",
  projectId: "taskora-5b226",
  storageBucket: "taskora-5b226.firebasestorage.app",
  messagingSenderId: "310467636142",
  appId: "1:310467636142:web:41b0aa0d2917cf461e763f",
  measurementId: "G-0S22VTDXYD"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
