// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// ===========================
// 🔧 Firebase Configuration
// ===========================
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

// ===========================
// 🔐 LOGIN PAGE
// ===========================
if (document.body.classList.contains('login-page')) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const statusEl = document.getElementById('loginStatus');

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;
        if (role === "admin") {
          window.location.href = "/admin/";
        } else {
          window.location.href = "members.html";
        }
      } else {
        setStatus("No user data found. Contact admin.");
      }
    } catch (error) {
      setStatus(`Login failed: ${error.message}`);
    }
  });
}

// ===========================
// 👤 MEMBERS PAGE
// ===========================
if (document.body.classList.contains('members-page')) {
  const nameEl = document.getElementById('profName');
  const emailEl = document.getElementById('profEmail');
  const roleEl = document.getElementById('profRoles');
  const btnLogout = document.getElementById('btnLogout');
  const guardMsg = document.getElementById('guardMsg');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (nameEl) nameEl.textContent = userData.name || '—';
        if (emailEl) emailEl.textContent = userData.email || user.email || '—';
        if (roleEl) roleEl.textContent = userData.role || 'member';
      } else {
        guardMsg.textContent = "Access denied. No user record found.";
      }
    } else {
      window.location.href = "login.html";
    }
  });

  btnLogout.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = "login.html";
  });
}
