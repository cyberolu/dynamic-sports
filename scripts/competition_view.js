import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM
const compTitle = document.getElementById("compTitle");
const compMeta = document.getElementById("compMeta");
const listBox = document.getElementById("publicRegistrantList");

const params = new URLSearchParams(window.location.search);
const compId = params.get("id");

if (!compId) {
  listBox.innerHTML = `<p class="muted small">Invalid competition.</p>`;
  throw new Error("Missing competition ID");
}

loadCompetition();
loadRegistrants();


// LOAD COMPETITION INFO
async function loadCompetition() {
  const snap = await getDoc(doc(db, "competitions", compId));
  if (!snap.exists()) return;

  const c = snap.data();

  compTitle.textContent = c.name;
  compMeta.textContent = `${c.date || ""} • ${c.location || ""}`;
}


// LOAD REGISTRANTS PUBLIC VIEW
async function loadRegistrants() {
  listBox.innerHTML = "<p class='muted'>Loading athletes…</p>";

  const regs = [];

  // Main registrations
  const q1 = query(collection(db, "registrations"), where("compId", "==", compId));
  const snap1 = await getDocs(q1);
  snap1.forEach(d => regs.push({ id: d.id, ...d.data() }));

  // Backup (if any)
  const q2 = query(collection(db, "competitionRegistrations"), where("competitionId", "==", compId));
  const snap2 = await getDocs(q2);
  snap2.forEach(d => regs.push({ id: d.id, ...d.data() }));

  if (!regs.length) {
    listBox.innerHTML = `<p class='muted small'>No athletes registered yet.</p>`;
    return;
  }

  // GROUP BY EVENT
  const grouped = {};

  regs.forEach(r => {
    const name = r.memberName || r.guestName || r.name || "Unknown athlete";
    const gender = r.memberGender || r.guestGender || r.gender || "Unknown";
    const events = Array.isArray(r.events) ? r.events : ["Unknown"];

    events.forEach(ev => {
      if (!grouped[ev]) grouped[ev] = [];
      grouped[ev].push({ name, gender });
    });
  });

  renderTables(grouped);
}


// RENDER TABLES
function renderTables(groupData) {
  listBox.innerHTML = "";

  Object.keys(groupData).forEach(eventName => {

    const section = document.createElement("div");
    section.classList.add("event-section");

    section.innerHTML = `
      <h2>${eventName}</h2>
      <table class="registrant-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Gender</th>
          </tr>
        </thead>
        <tbody>
          ${groupData[eventName]
            .map(r => `
              <tr>
                <td>${r.name}</td>
                <td>${r.gender}</td>
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    `;

    listBox.appendChild(section);
  });
}
