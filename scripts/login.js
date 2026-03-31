// ==========================================
// LOGIN + SIGN-UP + PASSWORD RESET
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.appspot.com",
  messagingSenderId: "382189793627",
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e",
  measurementId: "G-K059EW003Z"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper
function setStatus(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

// ==========================================
// LOGIN
// ==========================================
const loginBtn = document.getElementById("btnLogin");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const status = "loginStatus";

    if (!email || !password) {
      setStatus(status, "Please enter both email and password.");
      return;
    }

    setStatus(status, "Signing in...");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Get role from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let role = "athlete"; // default
      if (docSnap.exists()) {
        const data = docSnap.data();
        role = data.role || "athlete";
      }

      localStorage.setItem("role", role);
      setStatus(status, `Welcome back!`);

      // Redirect based on role
      setTimeout(() => {
        if (role === "admin") {
          window.location.href = "../admin/";
        } else {
          window.location.href = "../members/";
        }
      }, 600);

    } catch (error) {
      console.error(error);
      setStatus(status, "Invalid email or password.");
    }
  });
}

// ==========================================
// SIGN-UP (with ROLE SELECTION)
// ==========================================
const signupBtn = document.getElementById("btnSignup");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const newName = document.getElementById("newName").value.trim();
    const newEmail = document.getElementById("newEmail").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const role = document.getElementById("roleSelect")?.value || "athlete"; // <--- NEW

    const status = "signupStatus";

    if (!newName || !newEmail || !newPassword) {
      setStatus(status, "Please fill in all fields.");
      return;
    }

    setStatus(status, "Creating account...");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      const user = userCred.user;

      // Save user profile
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: newName,
        email: newEmail,
        role: role,               // athlete | coach | other
        createdAt: new Date()
      });

      setStatus(status, "Account created successfully!");

      document.getElementById("newName").value = "";
      document.getElementById("newEmail").value = "";
      document.getElementById("newPassword").value = "";

    } catch (error) {
      console.error("Signup failed:", error.message);
      setStatus(status, "Signup failed. Try again later.");
    }
  });
}

// ==========================================
// PASSWORD RESET
// ==========================================
const resetLink = document.getElementById("resetLink");
if (resetLink) {
  resetLink.addEventListener("click", async (e) => {
    e.preventDefault();

    const emailField = document.getElementById("email");
    let email = emailField.value.trim();

    if (!email) {
      email = prompt("Enter your email to receive a password reset link:");
    }

    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("loginStatus", `Password reset email sent to ${email}.`);
    } catch (error) {
      setStatus("loginStatus", "Unable to send password reset email.");
    }
  });
}
