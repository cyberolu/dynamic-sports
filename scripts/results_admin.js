// scripts/results_admin.js

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
  deleteDoc,
  orderBy
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
const eventSelect = document.getElementById("eventSelect");
const roundSelect = document.getElementById("roundSelect");
const heatSelect = document.getElementById("heatSelect");
const windInput = document.getElementById("windInput");

const loadStartListBtn = document.getElementById("loadStartListBtn");
const resultsTableBody = document.getElementById("resultsTableBody");
const saveResultsBtn = document.getElementById("saveResultsBtn");
const resultMsg = document.getElementById("resultMsg");

// ------------------------------------------------------
// URL PARAMS
// ------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const compId = params.get("comp");
const compName = params.get("name") || "";

if (!compId) {
  if (heading) heading.textContent = "Enter Results – Invalid competition";
  throw new Error("Missing comp ID");
}

if (heading) {
  heading.textContent = "Enter Results – " + compName;
}

// populate heat select 1–12
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
  if (!snap.exists()) return;

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
// LOAD START LIST FOR EVENT + ROUND + HEAT
// ------------------------------------------------------
async function loadStartList() {
  if (!eventSelect || !roundSelect || !heatSelect || !resultsTableBody) {
    return;
  }

  const eventName = eventSelect.value;
  const round = roundSelect.value;
  const heatValue = heatSelect.value;

  if (!eventName || !round || !heatValue) {
    if (resultMsg) {
      resultMsg.textContent = "Select event, round and heat.";
    }
    return;
  }

  const heat = Number(heatValue);

  if (resultMsg) resultMsg.textContent = "Loading start list…";
  resultsTableBody.innerHTML = "";

  const q = query(
    collection(db, "competitions", compId, "startLists"),
    where("event", "==", eventName),
    where("round", "==", round),
    where("heat", "==", heat)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    if (resultMsg) {
      resultMsg.textContent = "No start list found for this round and heat.";
    }
    return;
  }

  const lanes = [];
  snap.forEach(function (ds) {
    const data = ds.data();
    lanes.push({
      id: ds.id,
      lane: data.lane,
      athleteName: data.athleteName,
      club: data.club || "",
      athleteUid: data.athleteUid || null,
      regId: data.regId || null
    });
  });

  lanes.sort(function (a, b) {
    return a.lane - b.lane;
  });

  lanes.forEach(function (l) {
    const tr = document.createElement("tr");

    tr.innerHTML =
      "<td>" +
      l.lane +
      "</td>" +
      "<td>" +
      l.athleteName +
      "</td>" +
      "<td>" +
      (l.club || "-") +
      "</td>" +
      '<td><input class="input small perf-input" placeholder="Time/Distance"></td>' +
      '<td><input type="number" min="1" max="100" class="input small pos-input"></td>' +
      '<td>' +
      '<select class="input small status-input">' +
      '<option value="OK">OK</option>' +
      '<option value="DQ">DQ</option>' +
      '<option value="DNS">DNS</option>' +
      '<option value="DNF">DNF</option>' +
      "</select>" +
      "</td>";

    tr.dataset.lane = String(l.lane);
    tr.dataset.athleteName = l.athleteName;
    tr.dataset.athleteUid = l.athleteUid || "";
    tr.dataset.regId = l.regId || "";

    resultsTableBody.appendChild(tr);
  });

  if (resultMsg) {
    resultMsg.textContent = "Enter performances, positions and status, then save.";
  }
}

// ------------------------------------------------------
// SAVE RESULTS FOR EVENT + ROUND + HEAT
// ------------------------------------------------------
async function saveResults() {
  if (!eventSelect || !roundSelect || !heatSelect || !resultsTableBody) {
    return;
  }

  const eventName = eventSelect.value;
  const round = roundSelect.value;
  const heatValue = heatSelect.value;
  const wind = windInput ? windInput.value.trim() : "";

  if (!eventName || !round || !heatValue) {
    if (resultMsg) resultMsg.textContent = "Select event, round and heat.";
    return;
  }

  const heat = Number(heatValue);
  const rows = Array.prototype.slice.call(
    resultsTableBody.querySelectorAll("tr")
  );

  if (!rows.length) {
    if (resultMsg) resultMsg.textContent = "No rows to save.";
    return;
  }

  if (resultMsg) resultMsg.textContent = "Saving results…";

  // Remove existing results for this event/round/heat so we can re-save cleanly
  const existingQ = query(
    collection(db, "competitions", compId, "results"),
    where("event", "==", eventName),
    where("round", "==", round),
    where("heat", "==", heat)
  );
  const existingSnap = await getDocs(existingQ);
  for (let i = 0; i < existingSnap.docs.length; i += 1) {
    const d = existingSnap.docs[i];
    await deleteDoc(
      doc(db, "competitions", compId, "results", d.id)
    );
  }

  let savedCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    const tr = rows[i];
    const perfInput = tr.querySelector(".perf-input");
    const posInput = tr.querySelector(".pos-input");
    const statusSelect = tr.querySelector(".status-input");

    const performance = perfInput ? perfInput.value.trim() : "";
    const positionValue = posInput ? posInput.value.trim() : "";
    const status = statusSelect ? statusSelect.value : "OK";

    const lane = Number(tr.dataset.lane || "0");
    const athleteName = tr.dataset.athleteName || "";
    const athleteUid = tr.dataset.athleteUid || null;
    const regId = tr.dataset.regId || null;

    // If status is OK but there is no performance, skip row
    if (!performance && status === "OK") {
      // eslint-disable-next-line no-continue
      continue;
    }

    const position = positionValue ? Number(positionValue) : null;

    await addDoc(collection(db, "competitions", compId, "results"), {
      event: eventName,
      round: round,
      heat: heat,
      lane: lane,
      athleteName: athleteName,
      athleteUid: athleteUid,
      regId: regId,
      performance: performance,
      position: position,
      status: status,
      wind: wind || null,
      createdAt: new Date()
    });

    savedCount += 1;
  }

  if (resultMsg) {
    if (savedCount === 0) {
      resultMsg.textContent = "Nothing saved – no valid performances.";
    } else {
      resultMsg.textContent =
        "Saved " +
        savedCount +
        " results for " +
        eventName +
        " " +
        round +
        " heat " +
        heatValue +
        ".";
    }
  }
}

// ------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------
if (loadStartListBtn) {
  loadStartListBtn.addEventListener("click", function () {
    loadStartList();
  });
}

if (saveResultsBtn) {
  saveResultsBtn.addEventListener("click", function () {
    saveResults();
  });
}

if (eventSelect) {
  eventSelect.addEventListener("change", function () {
    if (resultsTableBody) resultsTableBody.innerHTML = "";
    if (resultMsg) resultMsg.textContent = "";
  });
}

if (roundSelect) {
  roundSelect.addEventListener("change", function () {
    if (resultsTableBody) resultsTableBody.innerHTML = "";
    if (resultMsg) resultMsg.textContent = "";
  });
}

if (heatSelect) {
  heatSelect.addEventListener("change", function () {
    if (resultsTableBody) resultsTableBody.innerHTML = "";
    if (resultMsg) resultMsg.textContent = "";
  });
}

// initial
loadEvents();
