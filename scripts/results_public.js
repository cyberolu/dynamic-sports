import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase setup
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const compHeading = document.getElementById("compNameHeading");
const compDate = document.getElementById("compDate");

const eventSelect = document.getElementById("eventSelect");
const roundSelect = document.getElementById("roundSelect");
const heatSelect = document.getElementById("heatSelect");

const tabStart = document.getElementById("tabStart");
const tabResults = document.getElementById("tabResults");
const eventTitle = document.getElementById("eventTitle");

// URL parameters
const params = new URLSearchParams(window.location.search);
const compId = params.get("comp");

// 1 — Load competition info & events
async function loadCompetition() {
  const snap = await getDoc(doc(db, "competitions", compId));
  if (!snap.exists()) return;

  const c = snap.data();
  compHeading.textContent = c.name;
  compDate.textContent = c.date;

  // populate event dropdown
  eventSelect.innerHTML = `<option value="">Select Event</option>`;
  (c.events || []).forEach(ev => {
    const opt = document.createElement("option");
    opt.value = ev;
    opt.textContent = ev;
    eventSelect.appendChild(opt);
  });
}

// 2 — When an event is selected, load available rounds
async function loadRounds() {
  const event = eventSelect.value;
  if (!event) {
    roundSelect.innerHTML = "";
    heatSelect.innerHTML = "";
    return;
  }

  roundSelect.innerHTML = `<option value="">Select Round</option>`;

  const q = query(
    collection(db, "competitions", compId, "startLists"),
    where("event", "==", event)
  );

  const snap = await getDocs(q);

  const rounds = new Set();
  snap.forEach(ds => rounds.add(ds.data().round));

  [...rounds].sort().forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    roundSelect.appendChild(opt);
  });
}

// 3 — Load heats for selected event + round
async function loadHeats() {
  const event = eventSelect.value;
  const round = roundSelect.value;

  if (!event || !round) {
    heatSelect.innerHTML = "";
    return;
  }

  heatSelect.innerHTML = `<option value="">Select Heat</option>`;

  const q = query(
    collection(db, "competitions", compId, "startLists"),
    where("event", "==", event),
    where("round", "==", round)
  );

  const snap = await getDocs(q);

  const heats = new Set();
  snap.forEach(ds => heats.add(ds.data().heat));

  [...heats].sort((a, b) => a - b).forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = `Heat ${h}`;
    heatSelect.appendChild(opt);
  });
}

// 4 — Load Start List for event + round + heat
async function loadStartList() {
  const event = eventSelect.value;
  const round = roundSelect.value;
  const heat = Number(heatSelect.value);

  if (!event || !round || !heat) {
    tabStart.innerHTML = `<p class="muted">Select event, round, and heat.</p>`;
    return;
  }

  eventTitle.textContent = `${event} – ${round}, Heat ${heat}`;
  tabStart.innerHTML = `<p class="muted">Loading start list...</p>`;

  const q = query(
    collection(db, "competitions", compId, "startLists"),
    where("event", "==", event),
    where("round", "==", round),
    where("heat", "==", heat)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    tabStart.innerHTML = `<p class="muted">No athletes assigned.</p>`;
    return;
  }

  const lanes = [];
  snap.forEach(ds => lanes.push(ds.data()));
  lanes.sort((a, b) => a.lane - b.lane);

  tabStart.innerHTML = `
    <table class="table">
      <thead>
        <tr>
          <th>Lane</th>
          <th>Athlete</th>
          <th>Club</th>
        </tr>
      </thead>
      <tbody>
        ${lanes.map(l => `
          <tr>
            <td>${l.lane}</td>
            <td>${l.athleteName}</td>
            <td>${l.club || "-"}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

// 5 — Load Results
async function loadResults() {
  const event = eventSelect.value;
  const round = roundSelect.value;
  const heat = Number(heatSelect.value);

  if (!event || !round || !heat) {
    tabResults.innerHTML = `<p class="muted">Select event, round, and heat.</p>`;
    return;
  }

  tabResults.innerHTML = `<p class="muted">Loading results...</p>`;

  const q = query(
    collection(db, "competitions", compId, "results"),
    where("event", "==", event),
    where("round", "==", round),
    where("heat", "==", heat),
    orderBy("position")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    tabResults.innerHTML = `<p class="muted">No results yet.</p>`;
    return;
  }

  const rows = [];
  snap.forEach(ds => rows.push(ds.data()));

  const wind = rows[0].wind ? ` (Wind: ${rows[0].wind})` : "";

  tabResults.innerHTML = `
    <h3>Official Results${wind}</h3>
    <table class="table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Lane</th>
          <th>Athlete</th>
          <th>Performance</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.position || "-"}</td>
            <td>${r.lane}</td>
            <td>${r.athleteName}</td>
            <td>${r.performance}</td>
            <td>${r.status}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;
}

// 6 — Tab switching logic
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById("tab" + tab.dataset.tab).classList.add("active");
  });
});

// Dropdown listeners
eventSelect.addEventListener("change", () => {
  loadRounds();
  tabStart.innerHTML = "";
  tabResults.innerHTML = "";
});

roundSelect.addEventListener("change", () => {
  loadHeats();
  tabStart.innerHTML = "";
  tabResults.innerHTML = "";
});

heatSelect.addEventListener("change", () => {
  loadStartList();
  loadResults();
});

// Initial load
loadCompetition();
