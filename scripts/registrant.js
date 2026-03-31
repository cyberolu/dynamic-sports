// scripts/registrant.js

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


// ------------------------------------------------------
// FIREBASE INIT
// ------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


// ------------------------------------------------------
// DOM ELEMENTS
// ------------------------------------------------------
const compTitle = document.getElementById("compTitle");
const compMeta = document.getElementById("compMeta");
const registrantList = document.getElementById("registrantList");
const athletesLink = document.getElementById("athletesLink");


// ------------------------------------------------------
// COMPETITION ID
// ------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const compId = params.get("id");

if (!compId) {
  registrantList.innerHTML = "<p class='muted small'>Invalid competition ID.</p>";
  throw new Error("Missing competition ID in URL");
}

// Update nav link
if (athletesLink) {
  athletesLink.href = "../registrant/index.html?id=" + compId;
}

loadCompetition();
loadRegistrants();


// ------------------------------------------------------
// LOAD COMPETITION INFO
// ------------------------------------------------------
async function loadCompetition() {
  const snap = await getDoc(doc(db, "competitions", compId));
  if (!snap.exists()) return;

  const c = snap.data();

  compTitle.textContent = "Registered Athletes";
  compMeta.textContent = c.name + " • " + (c.date || "TBA") + " • " + (c.location || "TBA");
}


// ------------------------------------------------------
// NORMALISE USER DATA
// ------------------------------------------------------
async function resolveUserData(reg) {

  let name =
    reg.memberName ||
    reg.guestName ||
    reg.name ||
    "";

  let gender = reg.gender || "";

  const uid =
    reg.uid ||
    reg.userId ||
    reg.userUID ||
    reg.memberId ||
    reg.guestId ||
    "";

  if (!uid) {
    return {
      name: name || "Unknown athlete",
      gender: gender || "Unknown"
    };
  }

  const userSnap = await getDoc(doc(db, "users", uid));

  if (!userSnap.exists()) {
    return {
      name: name || "Unknown athlete",
      gender: gender || "Unknown"
    };
  }

  const user = userSnap.data();

  return {
    name: user.name || name || "Unknown athlete",
    gender: user.gender || gender || "Unknown"
  };
}


// ------------------------------------------------------
// LOAD REGISTRANTS
// ------------------------------------------------------
async function loadRegistrants() {
  registrantList.innerHTML = "<p class='muted'>Loading…</p>";

  const regs = [];

  const q1 = query(collection(db, "registrations"), where("compId", "==", compId));
  const s1 = await getDocs(q1);
  s1.forEach(ds => regs.push({ id: ds.id, ...ds.data() }));

  const q2 = query(collection(db, "competitionRegistrations"), where("competitionId", "==", compId));
  const s2 = await getDocs(q2);
  s2.forEach(ds => regs.push({ id: ds.id, ...ds.data() }));

  if (!regs.length) {
    registrantList.innerHTML = "<p class='muted small'>No athletes registered yet.</p>";
    return;
  }

  const grouped = {};

  for (const r of regs) {

    const user = await resolveUserData(r);

    const email =
      r.memberEmail ||
      r.guestEmail ||
      r.email ||
      "";

    const status = r.status || "pending";

    const events = Array.isArray(r.events) ? r.events : ["Unknown"];

    events.forEach(ev => {
      if (!grouped[ev]) grouped[ev] = [];

      grouped[ev].push({
        name: user.name,
        gender: user.gender,
        email: email,
        status: status
      });
    });
  }

  renderTables(grouped);
  enableExports(grouped);
}


// ------------------------------------------------------
// RENDER TABLES
// ------------------------------------------------------
function renderTables(groupData) {
  registrantList.innerHTML = "";

  Object.keys(groupData).forEach(eventName => {

    const section = document.createElement("div");
    section.classList.add("event-section");

    section.innerHTML =
      "<h2>" + eventName + "</h2>" +
      "<table class='registrant-table'>" +
      "<thead>" +
      "<tr>" +
      "<th>Athlete Name</th>" +
      "<th>Email</th>" +
      "<th>Gender</th>" +
      "<th>Status</th>" +
      "</tr>" +
      "</thead>" +
      "<tbody>" +
      groupData[eventName]
        .map(r =>
          "<tr>" +
          "<td>" + r.name + "</td>" +
          "<td>" + r.email + "</td>" +
          "<td>" + r.gender + "</td>" +
          "<td>" + r.status + "</td>" +
          "</tr>"
        )
        .join("") +
      "</tbody></table>";

    registrantList.appendChild(section);
  });
}


// ------------------------------------------------------
// EXPORTS
// ------------------------------------------------------
function enableExports(groupData) {

  const csvBtn = document.getElementById("exportCsv");
  const pdfBtn = document.getElementById("exportPdf");

  if (!csvBtn || !pdfBtn) return;

  csvBtn.onclick = () => {

    let csv = "Event,Name,Email,Gender,Status\n";

    Object.keys(groupData).forEach(ev => {
      groupData[ev].forEach(r => {
        csv += ev + "," + r.name + "," + r.email + "," + r.gender + "," + r.status + "\n";
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "registrants-" + compId + ".csv";
    a.click();
  };

  pdfBtn.onclick = () => {
    const win = window.open("", "_blank");

    win.document.write(
      "<html><head><title>Registrants PDF</title>" +
      "<style>body { font-family: Arial; padding: 20px; }" +
      "table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }" +
      "th, td { border: 1px solid #ccc; padding: 8px; }" +
      "th { background: #f0f0f0; }</style></head><body>" +
      registrantList.innerHTML +
      "</body></html>"
    );

    win.document.close();
    win.print();
  };
}
