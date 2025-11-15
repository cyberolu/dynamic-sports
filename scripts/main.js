// ===========================
// 🚀 Import Firebase (v11 SDK)
// ===========================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, doc, getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ===========================
// 🔧 Firebase Configuration
// ===========================
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.appspot.com",
  messagingSenderId: "382189793627",
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e",
  measurementId: "G-K059EW003Z"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===========================
// 🌍 Shared: Footer + Navbar
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Dynamic navbar injection
  const nav = document.querySelector(".nav");
  if (nav) {
    const role = localStorage.getItem("role");
    nav.innerHTML = `
      <a href="index.html">Home</a>
      <a href="news.html">News</a>
      <a href="competitions.html">Competitions</a>
      <a href="members.html">Members</a>
    `;
    if (role === "admin") {
      nav.innerHTML += `<a href="admin.html" style="font-weight:bold;">Admin</a>`;
      nav.innerHTML += `<a href="#" id="logoutLink" style="color:#b00;">Logout</a>`;
    } else if (role === "member") {
      nav.innerHTML += `<a href="#" id="logoutLink" style="color:#b00;">Logout</a>`;
    } else {
      nav.innerHTML += `<a href="login.html">Login</a>`;
    }

    // Logout handler
    document.addEventListener("click", async (e) => {
      if (e.target.id === "logoutLink") {
        await signOut(auth);
        localStorage.removeItem("role");
        window.location.href = "login.html";
      }
    });
  }
});

// ===========================
// 🔐 LOGIN PAGE
// ===========================
if (document.body.classList.contains('login-page')) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('btnLogin');
  const statusEl = document.getElementById('loginStatus');

  const setStatus = (msg) => { if (statusEl) statusEl.textContent = msg; };

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email || !password) return setStatus("Please enter both email and password.");

      setStatus("Signing in...");
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const role = docSnap.data().role || "member";
          localStorage.setItem("role", role);
          setStatus(`Welcome, ${role}!`);
          setTimeout(() => {
            if (role === "admin") window.location.href = "admin.html";
            else window.location.href = "members.html";
          }, 800);
        } else {
          setStatus("No user record found.");
        }
      } catch (error) {
        setStatus("Login failed. Check your credentials.");
      }
    });
  }
}

// ===========================
// 👥 MEMBERS PAGE
// ===========================
if (document.body.classList.contains('members-page')) {
  const nameEl = document.getElementById('profName');
  const emailEl = document.getElementById('profEmail');
  const roleEl = document.getElementById('profRoles');
  const guardMsg = document.getElementById('guardMsg');
  const btnLogout = document.getElementById('btnLogout');

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      if (nameEl) nameEl.textContent = userData.name || "—";
      if (emailEl) emailEl.textContent = userData.email || user.email;
      if (roleEl) roleEl.textContent = userData.role || "member";
    } else {
      if (guardMsg) guardMsg.textContent = "Access denied: User record missing.";
    }
  });

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      await signOut(auth);
      localStorage.removeItem("role");
      window.location.href = "login.html";
    });
  }
}
