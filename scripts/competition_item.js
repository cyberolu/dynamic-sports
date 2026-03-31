// ==========================================
// 🏆 Competition details + member / guest registration
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ✅ Firebase config (same as your other scripts)
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
const db = getFirestore(app);
const auth = getAuth(app);

// Read competition ID from URL
const params = new URLSearchParams(window.location.search);
const compId = params.get("id");

// DOM references
const compContainer = document.getElementById("competitionArticle");
const memberSection = document.getElementById("memberRegSection");
const guestSection = document.getElementById("guestRegSection");
const memberEventsList = document.getElementById("memberEventsList");
const guestEventsList = document.getElementById("guestEventsList");

let currentCompetition = null;

// ==========================================
// 🔹 Load competition details
// ==========================================
async function loadCompetition() {
  if (!compId) {
    compContainer.innerHTML = "<p class='muted'>Competition not found.</p>";
    return;
  }

  const ref = doc(db, "competitions", compId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    compContainer.innerHTML = "<p class='muted'>Competition not found.</p>";
    return;
  }

  const d = snap.data();
  currentCompetition = { id: compId, ...d };

  compContainer.innerHTML = `
    <div class="article-page">
      ${d.imageURL ? `<img src="${d.imageURL}" class="article-image">` : ""}
      <h2>${d.name}</h2>
      <p><strong>Date:</strong> ${d.date || "TBA"}</p>
      <p><strong>Location:</strong> ${d.location || "TBA"}</p>
    </div>
  `;

  const events = Array.isArray(d.events) ? d.events : [];
  renderEvents(events);
}

// Render events as checkboxes for member + guest
function renderEvents(events) {
  memberEventsList.innerHTML = "";
  guestEventsList.innerHTML = "";

  if (!events || events.length === 0) {
    const msg = "<p class='muted'>No event list has been added yet.</p>";
    memberEventsList.innerHTML = msg;
    guestEventsList.innerHTML = msg;
    return;
  }

  events.forEach(ev => {
    memberEventsList.innerHTML += `
      <label style="display:block;">
        <input type="checkbox" class="memEv" value="${ev}">
        ${ev}
      </label>
    `;

    guestEventsList.innerHTML += `
      <label style="display:block;">
        <input type="checkbox" class="guestEv" value="${ev}">
        ${ev}
      </label>
    `;
  });
}

// ==========================================
// 👤 Member vs guest display
// ==========================================
onAuthStateChanged(auth, user => {
  if (user) {
    // Logged in → show member registration, hide guest form
    if (memberSection) memberSection.style.display = "block";
    if (guestSection) guestSection.style.display = "none";

    const memNameEl = document.getElementById("memName");
    const memEmailEl = document.getElementById("memEmail");

    if (memNameEl) memNameEl.textContent = user.displayName || "Member";
    if (memEmailEl) memEmailEl.textContent = user.email || "";
  } else {
    // Not logged in → show guest registration
    if (memberSection) memberSection.style.display = "none";
    if (guestSection) guestSection.style.display = "block";
  }
});

// ==========================================
// ✅ Member registration submit
// ==========================================
const memberSubmitBtn = document.getElementById("memberRegSubmit");
if (memberSubmitBtn) {
  memberSubmitBtn.onclick = async () => {
    const user = auth.currentUser;
    const statusEl = document.getElementById("memberRegStatus");

    if (!user) {
      if (statusEl) statusEl.textContent = "Please log in as a member first.";
      return;
    }
    if (!currentCompetition) {
      if (statusEl) statusEl.textContent = "Competition data not loaded.";
      return;
    }

    const selected = Array
      .from(document.querySelectorAll(".memEv:checked"))
      .map(i => i.value);

    if (selected.length === 0) {
      if (statusEl) statusEl.textContent = "Select at least one event.";
      return;
    }

    if (statusEl) statusEl.textContent = "Submitting registration...";

    try {
      await addDoc(collection(db, "registrations"), {
  compId: currentCompetition.id,
  compName: currentCompetition.name || "",
  uid: user.uid,
  name: user.displayName || "",
  email: user.email || "",
  events: selected,
  via: "member",
  status: "pending",
  paid: false,
  createdAt: serverTimestamp()
});


      if (statusEl) {
        statusEl.textContent =
          "Registration submitted. Status: pending until payment and approval.";
      }
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = "Failed to submit registration.";
    }
  };
}

// ==========================================
// ✅ Guest registration submit
// ==========================================
const guestSubmitBtn = document.getElementById("guestRegSubmit");
if (guestSubmitBtn) {
  guestSubmitBtn.onclick = async () => {
    const name = document.getElementById("guestName").value.trim();
    const email = document.getElementById("guestEmail").value.trim();
    const phone = document.getElementById("guestPhone").value.trim();
    const club = document.getElementById("guestClub").value.trim();
    const dob = document.getElementById("guestDob").value;
    const gender = document.getElementById("guestGender").value;
    const statusEl = document.getElementById("guestRegStatus");

    if (!currentCompetition) {
      if (statusEl) statusEl.textContent = "Competition data not loaded.";
      return;
    }
    if (!name || !email) {
      if (statusEl) statusEl.textContent = "Name and email are required.";
      return;
    }

    const selected = Array
      .from(document.querySelectorAll(".guestEv:checked"))
      .map(i => i.value);

    if (selected.length === 0) {
      if (statusEl) statusEl.textContent = "Select at least one event.";
      return;
    }

    if (statusEl) statusEl.textContent = "Submitting registration...";

    try {
      await addDoc(collection(db, "registrations"), {
        compId: currentCompetition.id,
        compName: currentCompetition.name || "",
        uid: null,
        name,
        email,
        phone,
        club,
        dob,
        gender,
        events: selected,
        via: "guest",
        status: "pending",      // ✅ approval workflow
        paid: false,
        createdAt: serverTimestamp()
      });

      if (statusEl) {
        statusEl.textContent =
          "Registration submitted. Status: pending until payment and approval.";
      }
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = "Failed to submit registration.";
    }
  };
}
// Public "View Registered Athletes" link
if (document.getElementById("publicViewRegsBtn")) {
  document.getElementById("publicViewRegsBtn").onclick = () => {
    window.location.href = `../competition_view/?id=${encodeURIComponent(compId)}`;
  };
}


// ==========================================
// 🚀 Start
// ==========================================
document.addEventListener("DOMContentLoaded", loadCompetition);
