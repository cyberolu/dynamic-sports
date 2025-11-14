// ==========================================
// 👤 MEMBERS PAGE — User Dashboard (with ImgBB uploads)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, onAuthStateChanged, signOut, updateProfile 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ==========================================
// 🔥 Firebase Config
// ==========================================
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

// ==========================================
// 🔗 DOM ELEMENTS
// ==========================================
const nameEl = document.getElementById("profName");
const emailEl = document.getElementById("profEmail");
const roleEl = document.getElementById("profRole");
const memberSinceEl = document.getElementById("memberSince");
const lastLoginEl = document.getElementById("lastLogin");
const eventsEl = document.getElementById("myEvents");
const logoutBtn = document.getElementById("btnLogout");
const guardMsg = document.getElementById("guardMsg");
const photoCircle = document.getElementById("photoCircle");
const profilePhoto = document.getElementById("profilePhoto");
const photoInput = document.getElementById("photoInput");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const removePhotoBtn = document.getElementById("removePhotoBtn");



// ==========================================
// 🧠 HANDLE AUTH STATE
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {
    nameEl.textContent = user.displayName || "Member";
    emailEl.textContent = user.email;

    memberSinceEl.textContent = new Date(user.metadata.creationTime).toLocaleDateString();
    lastLoginEl.textContent = new Date(user.metadata.lastSignInTime).toLocaleDateString();

    // Load user Firestore profile
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    let finalPhotoURL = null;

    if (snap.exists()) {
      const data = snap.data();
      roleEl.textContent = data.role || "member";

      // PRIORITY: Firestore value overrides Auth value
      if (data.photoURL) {
        finalPhotoURL = data.photoURL;
      }
    }

    // If Firestore says no image, enforce default
    if (!finalPhotoURL) {
      await updateProfile(user, { photoURL: null });
      profilePhoto.hidden = true;
      photoPlaceholder.hidden = false;
    } else {
      profilePhoto.src = finalPhotoURL;
      profilePhoto.hidden = false;
      photoPlaceholder.hidden = true;
    }

    loadUserEvents(user.uid);

  } catch (err) {
    console.error(err);
    guardMsg.textContent = "Error loading profile.";
  }
});


// ==========================================
// 🏅 LOAD EVENTS
// ==========================================
async function loadUserEvents(uid) {
  eventsEl.innerHTML = "";
  const q = query(collection(db, "competitions"), where("registeredUsers", "array-contains", uid));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    eventsEl.innerHTML = "<li>No events added yet.</li>";
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    eventsEl.innerHTML += `<li>${data.name} (${data.date || "TBA"})</li>`;
  });
}


// ==========================================
// 📸 UPLOAD PROFILE PHOTO — IMGBB
// ==========================================
photoCircle.onclick = () => photoInput.click();

photoInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const user = auth.currentUser;
  guardMsg.textContent = "Uploading photo...";

  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = async () => {
    try {
      const base64 = reader.result.split(",")[1];

      const res = await fetch("https://api.imgbb.com/1/upload?key=a2f60f22f85d5e086841f30f041be7e9", {
        method: "POST",
        body: new URLSearchParams({ image: base64 })
      });
      const json = await res.json();

      if (!json.success) throw new Error("Upload failed");

      const url = json.data.url;

      // Save to Auth
      await updateProfile(user, { photoURL: url });

      // Save to Firestore
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });

      // Update UI
      profilePhoto.src = url;
      profilePhoto.hidden = false;
      photoPlaceholder.hidden = true;

      guardMsg.textContent = "Photo updated.";

    } catch (err) {
      console.error(err);
      guardMsg.textContent = "Upload error.";
    }
  };
};


// ==========================================
// 🗑 REMOVE PROFILE PHOTO
// ==========================================
removePhotoBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    guardMsg.textContent = "Removing...";

    // Remove from Auth
    await updateProfile(user, { photoURL: null });

    // Remove from Firestore
    await updateDoc(doc(db, "users", user.uid), { photoURL: null });

    // Reset UI
    profilePhoto.hidden = true;
    photoPlaceholder.hidden = false;

    guardMsg.textContent = "Photo removed.";

  } catch (err) {
    console.error(err);
    guardMsg.textContent = "Failed to remove.";
  }
};


// ==========================================
// 🚪 LOGOUT
// ==========================================
logoutBtn.onclick = async () => {
  await signOut(auth);
  localStorage.removeItem("role");
  window.location.href = "login.html";
};

