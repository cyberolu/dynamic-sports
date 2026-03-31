// ==========================================
// 👤 MEMBERS PAGE — User Dashboard
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ------------------------------------------
// Firebase Config
// ------------------------------------------
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

// ------------------------------------------
// DOM Elements
// ------------------------------------------
const nameEl = document.getElementById("profName");
const emailEl = document.getElementById("profEmail");
const roleEl = document.getElementById("profRole");
const memberSinceEl = document.getElementById("memberSince");
const lastLoginEl = document.getElementById("lastLogin");
const eventsEl = document.getElementById("myEvents");
const logoutBtn = document.getElementById("btnLogout");
const guardMsg = document.getElementById("guardMsg");

// Photo elements
const photoCircle = document.getElementById("photoCircle");
const profilePhoto = document.getElementById("profilePhoto");
const photoInput = document.getElementById("photoInput");
const photoPlaceholder = document.getElementById("photoPlaceholder");
const removePhotoBtn = document.getElementById("removePhotoBtn");

// Gender elements
const genderSelect = document.getElementById("gender");
const saveGenderBtn = document.getElementById("saveGender");


// ==========================================
// 🧠 AUTH STATE — Load Profile
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("../login/");
    return;
  }

  try {
    let bestName = user.displayName || "";
    emailEl.textContent = user.email;

    memberSinceEl.textContent = new Date(
      user.metadata.creationTime
    ).toLocaleDateString();

    lastLoginEl.textContent = new Date(
      user.metadata.lastSignInTime
    ).toLocaleDateString();

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    await loadBiography(user.uid);

    let finalPhotoURL = null;

    if (snap.exists()) {
      const data = snap.data();

      roleEl.textContent = data.role || "member";
      genderSelect.value = data.gender || "";

      if (data.fullName?.trim()) {
        bestName = data.fullName.trim();
      } else if (data.firstName || data.lastName) {
        bestName = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      }

      if (data.photoURL) finalPhotoURL = data.photoURL;
    }

    nameEl.textContent = bestName || "Member";

    if (finalPhotoURL) {
      profilePhoto.src = finalPhotoURL;
      profilePhoto.hidden = false;
      photoPlaceholder.hidden = true;
    } else {
      profilePhoto.hidden = true;
      photoPlaceholder.hidden = false;
    }

    await loadUserEvents(user.uid);
    await loadEventHistory(user.uid);

  } catch (err) {
    console.error(err);
    guardMsg.textContent = "Error loading profile.";
  }
});


// ==========================================
// 🏅 LOAD USER EVENTS
// ==========================================
async function loadUserEvents(uid) {
  eventsEl.innerHTML = "<li>Loading…</li>";

  const allRegs = [];

  // New system
  try {
    const q1 = query(collection(db, "registrations"), where("uid", "==", uid));
    const snap1 = await getDocs(q1);

    snap1.forEach((docSnap) => {
      allRegs.push({
        id: docSnap.id,
        source: "registrations",
        ...docSnap.data()
      });
    });
  } catch (e) {
    console.error("Error reading registrations:", e);
  }

  // Old system (still supported)
  try {
    const q2 = query(
      collection(db, "competitionRegistrations"),
      where("memberId", "==", uid)
    );
    const snap2 = await getDocs(q2);

    snap2.forEach((docSnap) => {
      allRegs.push({
        id: docSnap.id,
        source: "competitionRegistrations",
        ...docSnap.data()
      });
    });
  } catch (e) {
    console.error("Error reading competitionRegistrations:", e);
  }

  if (!allRegs.length) {
    eventsEl.innerHTML = "<li>No registrations yet.</li>";
    return;
  }

  eventsEl.innerHTML = "";

  allRegs.forEach((r) => {
    const compName = r.compName || r.competitionName || "Competition";
    const eventsText = Array.isArray(r.events) ? r.events.join(", ") : "";
    const statusText = (r.status || "pending").toLowerCase();

    const deleteBtn =
      statusText === "rejected"
        ? `<button class="btn danger small deleteRegBtn"
             data-id="${r.id}"
             data-source="${r.source}">Delete</button>`
        : "";

    eventsEl.innerHTML += `
      <li class="event-item">
        <div>
          <strong>${compName}</strong><br>
          <span class="muted small">${eventsText}</span><br>
          <span class="muted small">Status: ${statusText}</span>
        </div>
        ${deleteBtn}
      </li>
    `;
  });

  // delete handlers
  document.querySelectorAll(".deleteRegBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const source = btn.dataset.source;

      if (!confirm("Delete this registration?")) return;

      try {
        await deleteDoc(doc(db, source, id));
        await loadUserEvents(uid);
      } catch (err) {
        console.error(err);
        alert("Error deleting registration.");
      }
    });
  });
}

// ==========================================
// 📸 UPLOAD PROFILE PHOTO (ImgBB)
// ==========================================
photoCircle.onclick = () => photoInput.click();

photoInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const user = auth.currentUser;
  if (!user) return;

  guardMsg.textContent = "Uploading photo...";

  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = async () => {
    try {
      const base64 = reader.result.split(",")[1];

      const res = await fetch(
        "https://api.imgbb.com/1/upload?key=a2f60f22f85d5e086841f30f041be7e9",
        {
          method: "POST",
          body: new URLSearchParams({ image: base64 })
        }
      );

      const json = await res.json();
      if (!json.success) throw new Error("Upload failed");

      const url = json.data.url;

      await updateProfile(user, { photoURL: url });
      await updateDoc(doc(db, "users", user.uid), { photoURL: url });

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
// 🗑 REMOVE PHOTO
// ==========================================
removePhotoBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    guardMsg.textContent = "Removing...";

    await updateProfile(user, { photoURL: null });
    await updateDoc(doc(db, "users", user.uid), { photoURL: null });

    profilePhoto.hidden = true;
    photoPlaceholder.hidden = false;

    guardMsg.textContent = "Photo removed.";
  } catch (err) {
    console.error(err);
    guardMsg.textContent = "Failed to remove.";
  }
};

// ==========================================
// 👤 SAVE + LOAD GENDER
// ==========================================
saveGenderBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await updateDoc(doc(db, "users", user.uid), {
    gender: genderSelect.value
  });

  alert("Gender saved!");
};

// ==========================================
// 🚪 LOGOUT
// ==========================================
logoutBtn.onclick = async () => {
  try {
    await signOut(auth);
  } finally {
    localStorage.removeItem("role");
    window.location.replace("../login/");
  }
};
// ==========================
// 🔵 BIOGRAPHY SAVE + LOAD
// ==========================
const bioText = document.getElementById("bioText");
const bioMsg = document.getElementById("bioMsg");
const saveBioBtn = document.getElementById("saveBioBtn");

async function loadBiography(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) {
    const data = snap.data();
    if (data.bio) bioText.value = data.bio;
  }
}

saveBioBtn.onclick = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await updateDoc(doc(db, "users", user.uid), {
    bio: bioText.value.trim()
  });

  bioMsg.textContent = "Biography updated!";
  setTimeout(() => (bioMsg.textContent = ""), 1500);
};
// ===============================
// 🔵 EVENT HISTORY (all statuses)
// ===============================
async function loadEventHistory(uid) {
  const target = document.getElementById("eventHistory");
  target.innerHTML = "<li>Loading…</li>";

  const history = [];

  try {
    // New system
    const q1 = query(collection(db, "registrations"), where("uid", "==", uid));
    const snap1 = await getDocs(q1);
    snap1.forEach(docSnap => {
      history.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (e) {
    console.error("registrations history error", e);
  }

  try {
    // Old system
    const q2 = query(
      collection(db, "competitionRegistrations"),
      where("memberId", "==", uid)
    );
    const snap2 = await getDocs(q2);
    snap2.forEach(docSnap => {
      history.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (e) {
    console.error("competitionRegistrations history error", e);
  }

  if (!history.length) {
    target.innerHTML = "<li>No event history found.</li>";
    return;
  }

  // Sort newest → oldest
  history.sort((a, b) => {
    const t1 = a.createdAt?.seconds || 0;
    const t2 = b.createdAt?.seconds || 0;
    return t2 - t1;
  });

  target.innerHTML = "";

  history.forEach(h => {
    const comp = h.compName || h.competitionName || "Competition";
    const events = Array.isArray(h.events) ? h.events.join(", ") : "—";
    const status = h.status || "pending";
    const date = h.createdAt?.seconds
      ? new Date(h.createdAt.seconds * 1000).toLocaleDateString()
      : "Unknown date";

    target.innerHTML += `
      <li class="event-item">
        <div>
          <strong>${comp}</strong><br>
          <span class="muted small">${events}</span><br>
          <span class="muted small">Status: ${status}</span><br>
          <span class="muted small">Registered: ${date}</span>
        </div>
      </li>
    `;
  });
}
