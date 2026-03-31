import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UI
const titleEl = document.getElementById("compTitle");
const metaEl = document.getElementById("compMeta");
const eventSelect = document.getElementById("eventSelect");
const heatSelect = document.getElementById("heatSelect");
const windInput = document.getElementById("windInput");
const loadBtn = document.getElementById("loadBtn");
const saveBtn = document.getElementById("saveBtn");

const maleTable = document.getElementById("laneTableMale");
const femaleTable = document.getElementById("laneTableFemale");

const statusMsg = document.getElementById("statusMsg");

// ID from URL
const params = new URLSearchParams(window.location.search);
const compId = params.get("comp");

if (!compId) {
  alert("Missing competition ID");
  throw new Error("Missing comp");
}

loadCompetition();
loadEvents();

// ----------------------------
// LOAD COMP INFO
// ----------------------------
async function loadCompetition() {
  const snap = await getDoc(doc(db, "competitions", compId));
  if (!snap.exists()) return;

  const c = snap.data();
  titleEl.textContent = "Start List – " + c.name;
  metaEl.textContent = c.date + " • " + c.location;
}

// ----------------------------
// LOAD EVENTS
// ----------------------------
async function loadEvents() {
  const snap = await getDoc(doc(db, "competitions", compId));
  if (!snap.exists()) return;

  const events = snap.data().events || [];
  eventSelect.innerHTML = "<option value=''>Select event</option>";

  events.forEach(ev => {
    eventSelect.innerHTML += "<option value='" + ev + "'>" + ev + "</option>";
  });
}

// ----------------------------
// RESOLVE NAME / GENDER
// ----------------------------
function resolveName(r) {
  return r.memberName || r.guestName || r.name || "Unknown athlete";
}

function resolveGender(r) {
  return r.gender || r.memberGender || r.guestGender || "-";
}

// ----------------------------
// LOAD ATHLETES (NOW INCLUDES MEMBERS)
// ----------------------------
loadBtn.onclick = async () => {
  const eventName = eventSelect.value;
  if (!eventName) {
    alert("Select an event first");
    return;
  }

  statusMsg.textContent = "Loading athletes...";

  let all = [];

  // 1 — GUEST registrations
  const q1 = query(
    collection(db, "registrations"),
    where("compId", "==", compId),
    where("events", "array-contains", eventName),
    where("status", "==", "approved")
  );
  const snap1 = await getDocs(q1);
  snap1.forEach(d => all.push(d.data()));

  // 2 — competitionRegistrations (backup)
  const q2 = query(
    collection(db, "competitionRegistrations"),
    where("competitionId", "==", compId),
    where("events", "array-contains", eventName),
    where("status", "==", "approved")
  );
  const snap2 = await getDocs(q2);
  snap2.forEach(d => all.push(d.data()));

  // 3 — MEMBER entries stored inside users/{uid}/competitionEntries
  const usersSnap = await getDocs(collection(db, "users"));
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;

    const entriesRef = collection(db, "users", uid, "competitionEntries");
    const entriesSnap = await getDocs(entriesRef);

    entriesSnap.forEach(entryDoc => {
      const entry = entryDoc.data();

      if (
        entry.compId === compId &&
        entry.status === "approved" &&
        entry.events?.includes(eventName)
      ) {
        all.push({
          name: entry.memberName || entry.name,
          gender: entry.memberGender || entry.gender,
          club: entry.club || "-",
          events: entry.events,
          compId: entry.compId
        });
      }
    });
  }

  if (!all.length) {
    statusMsg.textContent = "No approved athletes found";
    return;
  }

  // SPLIT GENDERS
  const males = all.filter(a => resolveGender(a).toLowerCase() === "male");
  const females = all.filter(a => resolveGender(a).toLowerCase() === "female");

  renderGenderTable(males, maleTable);
  renderGenderTable(females, femaleTable);

  statusMsg.textContent = "Loaded " + all.length + " athletes";
};


// ----------------------------
// RENDER TABLES BY GENDER
// ----------------------------
function renderGenderTable(list, tableRef) {
  tableRef.innerHTML = "";
  let lane = 1;

  list.forEach((a, index) => {
    const name = resolveName(a);
    const gender = resolveGender(a);
    const club = a.club || "-";

    tableRef.innerHTML +=
      "<tr>" +
        "<td>" +
          "<select class='laneSelect input small' data-index='" + index + "'>" +
            "<option value=''>Lane</option>" +
            Array.from({ length: 8 }, function (_, i) {
              const num = i + 1;
              return "<option value='" + num + "'>" + num + "</option>";
            }).join("") +
          "</select>" +
        "</td>" +
        "<td>" + name + "</td>" +
        "<td>" + gender + "</td>" +
        "<td>" + club + "</td>" +
      "</tr>";

    lane++;
  });

  enableLaneBlocking();
}

// ----------------------------
// DUPLICATE ATHLETE CHECK
// ----------------------------
function enforceUniqueAthletes(showAlert) {
  const rows = document.querySelectorAll("tbody tr");
  const seenNames = new Set();
  let duplicatesFound = false;

  rows.forEach(function (row) {
    const tds = row.querySelectorAll("td");
    const nameCell = tds[1];
    if (!nameCell) return;

    const name = nameCell.textContent.trim();
    if (!name) return;

    if (seenNames.has(name)) {
      duplicatesFound = true;
      row.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
    } else {
      seenNames.add(name);
      row.style.backgroundColor = "";
    }
  });

  if (duplicatesFound) {
    statusMsg.textContent = "Duplicate athletes detected in this event. Each athlete can only appear once per event.";
    statusMsg.style.color = "red";

    if (showAlert) {
      alert("Duplicate athletes found in this event. Remove the duplicates before saving.");
    }
  } else {
    if (statusMsg.textContent.indexOf("Duplicate athletes") === 0) {
      statusMsg.textContent = "";
      statusMsg.style.color = "";
    }
  }

  return !duplicatesFound;
}

// ----------------------------
// PREVENT DUPLICATE LANE SELECTION
// ----------------------------
function enableLaneBlocking() {
  const selects = document.querySelectorAll(".laneSelect");

  function recompute() {
    const taken = Array.prototype.slice
      .call(selects)
      .map(function (s) { return s.value; })
      .filter(function (v) { return v !== ""; });

    selects.forEach(function (s) {
      const current = s.value;

      Array.prototype.slice.call(s.options).forEach(function (opt) {
        if (!opt.value) return;

        if (opt.value !== current && taken.indexOf(opt.value) !== -1) {
          opt.disabled = true;
        } else {
          opt.disabled = false;
        }
      });
    });

    // also update duplicate-name highlighting
    enforceUniqueAthletes(false);
  }

  selects.forEach(function (sel) {
    sel.onchange = recompute;
  });

  recompute();
}

// ----------------------------
// SAVE START LIST
// ----------------------------
saveBtn.onclick = async () => {
  // block save if duplicate names
  if (!enforceUniqueAthletes(true)) {
    return;
  }

  const eventName = eventSelect.value;
  if (!eventName) {
    alert("Select an event.");
    return;
  }

  const heat = heatSelect.value;
  const wind = windInput.value;

  const allRows = document.querySelectorAll("tbody tr");
  let athletes = [];

  allRows.forEach(function (row) {
    const sel = row.querySelector("select");
    const lane = sel ? sel.value : "";
    const tds = row.querySelectorAll("td");

    if (lane !== "") {
      athletes.push({
        lane: Number(lane),
        name: tds[1].textContent,
        gender: tds[2].textContent,
        club: tds[3].textContent
      });
    }
  });

  if (!athletes.length) {
    alert("Assign at least one lane before saving.");
    return;
  }

  // prevent mixed gender in the same race
  const genders = Array.from(
    new Set(
      athletes
        .map(function (a) { return a.gender.toLowerCase(); })
        .filter(function (g) { return g && g !== "-"; })
    )
  );

  if (genders.length > 1) {
    alert("You cannot mix male and female athletes in the same race. Please create separate heats.");
    return;
  }

  // DELETE PREVIOUS LIST (prevents duplicate lists)
  const listRef = collection(db, "competitions", compId, "startlist");
  const existing = await getDocs(listRef);
  existing.forEach(function (d) { deleteDoc(d.ref); });

  // SAVE NEW LIST
  const newRef = doc(collection(db, "competitions", compId, "startlist"));

  await setDoc(newRef, {
    event: eventName,
    heat: heat,
    wind: wind,
    athletes: athletes,
    createdAt: new Date().toISOString()
  });

  alert("Start list saved successfully");
};
