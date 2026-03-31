// scripts/startlists.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc
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
// DOM REFERENCES
// ------------------------------------------------------
const heading = document.getElementById("pageHeading");
const compInfo = document.getElementById("compInfo");

const eventSelect = document.getElementById("eventSelect");
const roundSelect = document.getElementById("roundSelect");
const heatSelect = document.getElementById("heatSelect");

const loadAthletesBtn = document.getElementById("loadAthletesBtn");
const athleteTableBody = document.getElementById("athleteTableBody");
const saveStartListBtn = document.getElementById("saveStartListBtn");
const startMsg = document.getElementById("startMsg");

// ------------------------------------------------------
// URL PARAMS (comp + name)
// ------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const compId = params.get("comp");
const compName = params.get("name") || "";

if (!compId) {
  if (heading) heading.textContent = "Start Lists – Invalid competition";
  throw new Error("Missing comp ID in URL");
}

if (heading) heading.textContent = "Start Lists – " + compName;
if (compInfo) compInfo.textContent = "Competition ID: " + compId;

// populate heat options (1–12)
if (heatSelect) {
  heatSelect.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Select heat";
  heatSelect.appendChild(opt0);

  for (let h = 1; h <= 12; h += 1) {
    const opt = document.createElement("option");
    opt.value = String(h);
    opt.textContent = "Heat " + h;
    heatSelect.appendChild(opt);
  }
}

// ------------------------------------------------------
// LOAD COMPETITION EVENTS
// ------------------------------------------------------
async function loadEvents() {
  const snap = await getDoc(doc(db, "competitions", compId));
  if (!snap.exists()) {
    if (startMsg) startMsg.textContent = "Competition not found.";
    return;
  }
  const c = snap.data();
  const events = c.events || [];

  if (!eventSelect) return;

  eventSelect.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Select event";
  eventSelect.appendChild(opt0);

  events.forEach(function (ev) {
    const opt = document.createElement("option");
    opt.value = ev;
    opt.textContent = ev;
    eventSelect.appendChild(opt);
  });
}

// ------------------------------------------------------
// COLLECT APPROVED ATHLETES FOR THIS COMP / EVENT
// ------------------------------------------------------
async function collectApprovedAthletesForEvent(eventName) {
  const athletes = [];

  // 1. New registrations collection
  const q1 = query(
    collection(db, "registrations"),
    where("compId", "==", compId),
    where("status", "==", "approved"),
    where("events", "array-contains", eventName)
  );
  const snap1 = await getDocs(q1);

  // 2. Backup collection
  const q2 = query(
    collection(db, "competitionRegistrations"),
    where("competitionId", "==", compId),
    where("status", "==", "approved"),
    where("events", "array-contains", eventName)
  );
  const snap2 = await getDocs(q2);

  const docs = snap1.docs.concat(snap2.docs);

  for (let i = 0; i < docs.length; i += 1) {
    const d = docs[i];
    const reg = d.data();

    const regId = d.id;
    const uid = reg.uid || reg.userId || reg.userUID || reg.memberId || null;

    let name =
      reg.memberName ||
      reg.guestName ||
      reg.name ||
      "";

    let gender = reg.gender || "";
    let club = reg.club || reg.school || "";

    // Try to resolve full profile if we have uid
    if (uid) {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          const user = userSnap.data();
          if (!name) {
            name =
              user.name ||
              [user.firstName, user.lastName].filter(Boolean).join(" ") ||
              user.displayName ||
              reg.email ||
              "Unknown athlete";
          }
          gender = user.gender || gender || "";
          club = user.club || user.team || club || "";
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error resolving user profile", err);
      }
    }

    if (!name) {
      name = "Unknown athlete";
    }

    athletes.push({
      regId: regId,
      uid: uid,
      name: name,
      gender: gender || "-",
      club: club || "",
      events: reg.events || []
    });
  }

  return athletes;
}

// ------------------------------------------------------
// LOAD ATHLETES FOR SELECTED EVENT
// ------------------------------------------------------
async function loadAthletesForEvent() {
  if (!eventSelect || !roundSelect || !heatSelect || !athleteTableBody) {
    return;
  }

  const eventName = eventSelect.value;
  const round = roundSelect.value;
  const heatValue = heatSelect.value;

  if (!eventName || !round || !heatValue) {
    if (startMsg) startMsg.textContent = "Select event, round and heat first.";
    return;
  }

  if (startMsg) startMsg.textContent = "Loading approved athletes...";
  athleteTableBody.innerHTML = "";

  const athletes = await collectApprovedAthletesForEvent(eventName);

  if (!athletes.length) {
    if (startMsg) startMsg.textContent = "No approved athletes for this event.";
    return;
  }

  if (startMsg) {
    startMsg.textContent =
      "Assign lanes manually for " +
      eventName +
      " – " +
      round +
      " " +
      heatValue +
      ".";
  }

  // Build table rows, manual lane input
  athletes.forEach(function (a) {
    const tr = document.createElement("tr");

    tr.innerHTML =
      "<td>" +
      a.name +
      "</td>" +
      "<td>" +
      (a.gender || "-") +
      "</td>" +
      "<td>" +
      (a.club || "") +
      "</td>" +
      "<td>" +
      (Array.isArray(a.events) ? a.events.join(", ") : "") +
      "</td>" +
      '<td><input type="number" class="input small heat-input" min="1" max="12" value="' +
      heatValue +
      '"></td>' +
      '<td><input type="number" class="input small lane-input" min="1" max="8" placeholder="1-8"></td>';

    tr.dataset.regId = a.regId;
    tr.dataset.uid = a.uid || "";
    tr.dataset.name = a.name;
    tr.dataset.gender = a.gender || "-";
    tr.dataset.club = a.club || "";

    athleteTableBody.appendChild(tr);
  });
}

// ------------------------------------------------------
// SAVE START LIST FOR EVENT + ROUND + HEAT
// ------------------------------------------------------
async function saveStartList() {
  if (!eventSelect || !roundSelect || !heatSelect || !athleteTableBody) {
    return;
  }

  const eventName = eventSelect.value;
  const round = roundSelect.value;
  const defaultHeat = heatSelect.value;

  if (!eventName || !round || !defaultHeat) {
    if (startMsg) startMsg.textContent = "Select event, round and heat.";
    return;
  }

  const rows = Array.prototype.slice.call(
    athleteTableBody.querySelectorAll("tr")
  );
  if (!rows.length) {
    if (startMsg) startMsg.textContent = "No athletes to save.";
    return;
  }

  if (startMsg) startMsg.textContent = "Saving start list…";

  // Clear existing start list entries for this event/round/heat
  const existingQ = query(
    collection(db, "competitions", compId, "startLists"),
    where("event", "==", eventName),
    where("round", "==", round),
    where("heat", "==", Number(defaultHeat))
  );
  const existingSnap = await getDocs(existingQ);
  for (let i = 0; i < existingSnap.docs.length; i += 1) {
    const d = existingSnap.docs[i];
    await deleteDoc(
      doc(db, "competitions", compId, "startLists", d.id)
    );
  }

  let savedCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const tr = rows[i];
    const heatInput = tr.querySelector(".heat-input");
    const laneInput = tr.querySelector(".lane-input");

    const heatValue = heatInput ? heatInput.value : defaultHeat;
    const laneValue = laneInput ? laneInput.value : "";

    const heat = Number(heatValue || defaultHeat);
    const lane = Number(laneValue);

    if (!lane || lane < 1 || lane > 8) {
      // skip rows without a valid lane
      // eslint-disable-next-line no-continue
      continue;
    }

    const regId = tr.dataset.regId;
    const uid = tr.dataset.uid || null;
    const name = tr.dataset.name;
    const gender = tr.dataset.gender || "-";
    const club = tr.dataset.club || "";

    await addDoc(collection(db, "competitions", compId, "startLists"), {
      event: eventName,
      round: round,
      heat: heat,
      lane: lane,
      regId: regId,
      athleteUid: uid,
      athleteName: name,
      athleteGender: gender,
      club: club,
      createdAt: new Date()
    });

    savedCount += 1;
  }

  if (savedCount === 0) {
    if (startMsg) startMsg.textContent = "No valid lanes set – nothing saved.";
  } else {
    if (startMsg) {
      startMsg.textContent =
        "Saved " +
        savedCount +
        " lane assignments for " +
        eventName +
        " " +
        round +
        " heat " +
        defaultHeat +
        ".";
    }
  }
}

// ------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------
if (loadAthletesBtn) {
  loadAthletesBtn.addEventListener("click", function () {
    loadAthletesForEvent();
  });
}

if (saveStartListBtn) {
  saveStartListBtn.addEventListener("click", function () {
    saveStartList();
  });
}

// initial
loadEvents();
