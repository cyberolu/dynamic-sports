// ==========================================
// LOGIN + SIGN-UP + PASSWORD RESET
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, setDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.firebasestorage.app",
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

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      const role = docSnap.exists() ? docSnap.data().role : "member";

      localStorage.setItem("role", role);

      setStatus(status, `Welcome back!`);

      setTimeout(() => {
        window.location.href = role === "admin" ? "admin.html" : "members.html";
      }, 800);

    } catch (error) {
      setStatus(status, "Invalid email or password.");
    }
  });
}

// ==========================================
// SIGN-UP
// ==========================================
const signupBtn = document.getElementById("btnSignup");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const newName = document.getElementById("newName").value.trim();
    const newEmail = document.getElementById("newEmail").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const status = "signupStatus";

    if (!newName || !newEmail || !newPassword) {
      setStatus(status, "Please fill in all fields.");
      return;
    }

    setStatus(status, "Creating account...");

    try {
      const userCred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        name: newName,
        email: newEmail,
        role: "member",
        photoURL: "",
        createdAt: new Date().toISOString()
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
