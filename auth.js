// ===============================================
// 🔥 FIREBASE IMPORTS
// ===============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";


// ===============================================
// 🔧 FIREBASE CONFIG USING env.js
// ===============================================
const firebaseConfig = {
  apiKey: window.env.FIREBASE_API_KEY,
  authDomain: window.env.FIREBASE_AUTH_DOMAIN,
  projectId: window.env.FIREBASE_PROJECT_ID,
  storageBucket: window.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.env.FIREBASE_APP_ID,
  measurementId: window.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ===============================================
// ✨ UTILITY: STATUS MESSAGE
// ===============================================
function setStatus(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}


// ===================================================
// 🔐 LOGIN PAGE LOGIC
// ===================================================
if (document.body.classList.contains("login-page")) {

  const loginBtn = document.getElementById("btnLogin");

  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    setStatus("loginStatus", "Checking login...");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Fetch role
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setStatus("loginStatus", "Your account exists, but no profile record was found.");
        return;
      }

      const role = docSnap.data().role || "member";

      // Store for nav
      localStorage.setItem("role", role);

      setStatus("loginStatus", "Login successful!");

      setTimeout(() => {
        if (role === "admin") {
          window.location.href = "/admin/admin.html";
        } else {
          window.location.href = "members.html";
        }
      }, 800);

    } catch (err) {
      setStatus("loginStatus", "Login failed. Check your email and password.");
    }
  });


  // ===================================================
  // 🆕 SIGN-UP SECTION (REGISTER NEW USERS)
  // ===================================================
  const signupBtn = document.getElementById("btnSignup");

  if (signupBtn) {
    signupBtn.addEventListener("click", async () => {
      const newEmail = document.getElementById("newEmail").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();

      setStatus("signupStatus", "Creating your account...");

      try {
        const userCred = await createUserWithEmailAndPassword(auth, newEmail, newPassword);
        const user = userCred.user;

        // Create Firestore profile
        await setDoc(doc(db, "users", user.uid), {
          email: newEmail,
          role: "member",    // default role
          name: "",
          photoURL: "",
          createdAt: new Date().toISOString()
        });

        setStatus("signupStatus", "Account created. You can now log in.");
        document.getElementById("newEmail").value = "";
        document.getElementById("newPassword").value = "";

      } catch (err) {
        setStatus("signupStatus", "Signup failed. Try again.");
      }
    });
  }
}



// ===================================================
// 👤 MEMBERS PAGE LOGIC
// ===================================================
if (document.body.classList.contains("members-page")) {

  const nameEl = document.getElementById("profName");
  const emailEl = document.getElementById("profEmail");
  const roleEl = document.getElementById("profRoles");
  const logoutBtn = document.getElementById("btnLogout");

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      document.getElementById("guardMsg").textContent =
        "Profile missing. Contact admin.";
      return;
    }

    const data = snap.data();

    nameEl.textContent = data.name || "—";
    emailEl.textContent = data.email || user.email || "—";
    roleEl.textContent = data.role;
  });

  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}
