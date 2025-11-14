// ==========================================
// 🔐 LOGIN + SIGN-UP + PASSWORD RESET
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.firebasestorage.app",
  messagingSenderId: "382189793627",
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e",
  measurementId: "G-K059EW003Z"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Helper to show status messages
function setStatus(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

// ==========================================
// 🧭 LOGIN HANDLER
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

      // Get user role
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      const role = docSnap.exists() ? docSnap.data().role : "member";

      // Store role locally for nav display
      localStorage.setItem("role", role);

      setStatus(status, `Welcome back, ${role === "admin" ? "Admin" : "Member"}!`);

      setTimeout(() => {
        if (role === "admin") {
          window.location.href = "admin/index.html";
        } else {
          window.location.href = "members.html";
        }
      }, 1000);
      
    } catch (error) {
      console.error("Login error:", error.message);
      setStatus(status, "Invalid credentials or network error.");
    }
  });
}

// ==========================================
// 🆕 SIGN-UP HANDLER
// ==========================================
const signupBtn = document.getElementById("btnSignup");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const newEmail = document.getElementById("newEmail").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const status = "signupStatus";

    if (!newEmail || !newPassword) {
      setStatus(status, "Please fill in both fields.");
      return;
    }

    setStatus(status, "Creating account...");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      const user = userCred.user;

      // Add to Firestore
      await setDoc(doc(db, "users", user.uid), {
        email: newEmail,
        role: "member",
        createdAt: new Date().toISOString()
      });

      setStatus(status, "Account created successfully! You can now log in.");
      document.getElementById("newEmail").value = "";
      document.getElementById("newPassword").value = "";
    } catch (error) {
      console.error("Signup failed:", error.message);
      setStatus(status, "Signup failed. Try again later.");
    }
  });
}

// ==========================================
// 🔁 PASSWORD RESET HANDLER (IMPROVED UX)
// ==========================================
const resetLink = document.getElementById("resetLink");
if (resetLink) {
  resetLink.addEventListener("click", async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById("email");
    let email = emailInput.value.trim();

    // If email field is empty, prompt for it
    if (!email) {
      email = prompt("Enter your registered email to receive a password reset link:");
    }

    if (!email) {
      setStatus("loginStatus", "Password reset cancelled.");
      return;
    }

    setStatus("loginStatus", "Sending password reset email...");

    try {
      await sendPasswordResetEmail(auth, email);
      setStatus("loginStatus", `Password reset link sent to ${email}. Check your inbox.`);
    } catch (error) {
      console.error("Reset failed:", error.message);
      if (error.code === "auth/user-not-found") {
        setStatus("loginStatus", "No account found with that email.");
      } else {
        setStatus("loginStatus", "Unable to send reset email. Please try again later.");
      }
    }
  });
}
