// =====================================================
// ADMIN DASHBOARD — NEWS, COMPETITIONS, MEMBERS, REGISTRATIONS
// =====================================================

// Global caches
let regCache = []; // <-- FIXED: must be declared before use


import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// =====================================================
// FIREBASE CONFIG
// =====================================================
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.appspot.com",
  messagingSenderId: "382189793627",
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

history.pushState(null, "", location.href);
window.onpopstate = () => {
  history.pushState(null, "", location.href);
};

// =====================================================
// DOM ELEMENTS (SAFE LOOKUPS)
// =====================================================
const adminMsg       = document.getElementById("adminMsg");


const newsList       = document.getElementById("newsList");
const compList       = document.getElementById("compList");
const memberList     = document.getElementById("memberList");
const pendingRegs    = document.getElementById("pendingRegs");

const regSearch      = document.getElementById("regSearch");
const regCompFilter  = document.getElementById("regCompFilter");
const exportRegsCsv  = document.getElementById("exportRegsCsv");

// =====================================================
// AUTH CHECK
// =====================================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("../login/");
    return;
  }  

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists() || snap.data().role !== "admin") {
    window.location.replace("../login/");
    return;
  }
  

  adminMsg.textContent = `Welcome back, ${user.email}.`;

  await Promise.all([
    loadNews(),
    loadCompetitions(),
    loadMembers(),
    loadRegistrations()
  ]);
});

// =====================================================
// CLOUDINARY UPLOAD
// =====================================================
async function uploadToCloudinary(file, preset) {
  const url = "https://api.cloudinary.com/v1_1/ddiwzcu9j/image/upload";
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);

  const res = await fetch(url, { method: "POST", body: fd });
  return (await res.json()).secure_url;
}

const CLOUDINARY_PRESET_NEWS = "dynamicnews";
const CLOUDINARY_PRESET_COMP = "dynamiccompetitions";


// =====================================================
// NEWS — LOAD + DELETE
// =====================================================
async function loadNews() {
  newsList.innerHTML = "<li class='muted small'>Loading…</li>";

  const snap = await getDocs(
    query(collection(db, "news"), orderBy("createdAt", "desc"))
  );

  newsList.innerHTML = "";
  if (snap.empty) {
    newsList.innerHTML = "<li>No news yet.</li>";
    return;
  }

  snap.forEach((docSnap) => {
    const n = docSnap.data();
    const id = docSnap.id;

    const li = document.createElement("li");
    li.classList.add("admin-item");
    li.innerHTML = `
      <div class="admin-item-body">
        <strong>${n.title}</strong><br>
        <span class="muted small">
          ${n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : "No date"}
        </span><br>
        <span class="muted small">${n.summary || ""}</span><br>
        ${n.featuredImage ? `<img src="${n.featuredImage}" class="admin-thumb small">` : ""}
      </div>

      <div class="admin-item-actions">
        <button data-id="${id}" class="btn danger delNews">Delete</button>
      </div>
    `;

    newsList.appendChild(li);
  });

  document.querySelectorAll(".delNews").forEach((btn) => {
    btn.onclick = async () => {
      await deleteDoc(doc(db, "news", btn.dataset.id));
      loadNews();
    };
  });
}
// =====================================================
// NEWS — ADD (UPDATED FOR FB PREVIEWS + CLEAN SLUGS)
// =====================================================

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove special chars
    .replace(/\s+/g, "-")       // spaces to hyphens
    .replace(/-+/g, "-")        // collapse multiple hyphens
    .replace(/^-+|-+$/g, "");   // trim hyphens
}

async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const q = query(collection(db, "news"), where("slug", "==", slug));
    const snap = await getDocs(q);

    if (snap.empty) return slug;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

document.getElementById("addNewsBtn").onclick = async () => {
  const title = document.getElementById("newsTitle").value.trim();
  const summary = document.getElementById("newsSummary").value.trim();
  const content = document.getElementById("newsContent").value.trim();
  const file = document.getElementById("newsFeaturedImage").files[0];

  if (!title || !summary || !file) {
    alert("Title, summary, and featured image are required.");
    return;
  }

  try {
    const imageURL = await uploadToCloudinary(file, CLOUDINARY_PRESET_NEWS);

    const baseSlug = generateSlug(title);
    const slug = await ensureUniqueSlug(baseSlug);

    await addDoc(collection(db, "news"), {
      title,
      summary,
      desc: summary,
      content,
      slug,
      featuredImage: imageURL,
      image: imageURL,
      imageURL: imageURL,
      createdAt: serverTimestamp()
    });

    document.getElementById("newsTitle").value = "";
    document.getElementById("newsSummary").value = "";
    document.getElementById("newsContent").value = "";
    document.getElementById("newsFeaturedImage").value = "";

    alert("Article published.");
    loadNews();
  } catch (err) {
    console.error(err);
    alert("Failed to publish article.");
  }
};
// =====================================================
// COMPETITIONS — ADD
// =====================================================
document.getElementById("addCompBtn").onclick = async () => {
  const name = document.getElementById("compName").value.trim();
  const date = document.getElementById("compDate").value;
  const loc  = document.getElementById("compLocation").value.trim();
  const file = document.getElementById("compImage").files[0];

  const events = document.getElementById("compEvents").value
    .split("\n")
    .map((e) => e.trim())
    .filter(Boolean);

  if (!name || !date || !loc) {
    alert("Fill all fields.");
    return;
  }

  let imageURL = "";
  if (file) imageURL = await uploadToCloudinary(file, CLOUDINARY_PRESET_COMP);

  await addDoc(collection(db, "competitions"), {
    name,
    date,
    location: loc,
    events,
    imageURL: imageURL || null,
    registeredUsers: [],
    createdAt: serverTimestamp()
  });

  document.getElementById("compName").value = "";
  document.getElementById("compDate").value = "";
  document.getElementById("compLocation").value = "";
  document.getElementById("compEvents").value = "";
  document.getElementById("compImage").value = "";

  loadCompetitions();
};

// =====================================================
// COMPETITIONS — LOAD + DELETE + VIEW + ENTER RESULTS + EDIT STARTLIST
// =====================================================
async function loadCompetitions() {
  compList.innerHTML = "<li>Loading…</li>";

  const snap = await getDocs(
    query(collection(db, "competitions"), orderBy("date", "desc"))
  );

  compList.innerHTML = "";
  if (snap.empty) {
    compList.innerHTML = "<li>No competitions yet.</li>";
    return;
  }

  snap.forEach((docSnap) => {
    const c = docSnap.data();
    const id = docSnap.id;

    const li = document.createElement("li");
    li.classList.add("admin-item");

    li.innerHTML = `
      <div class="admin-item-body">
        <strong>${c.name}</strong><br>
        <span class="muted small">${c.date} • ${c.location}</span><br>
        <span class="muted small">Events: ${c.events.join(", ")}</span><br>
        ${c.imageURL ? `<img src="${c.imageURL}" class="admin-thumb small">` : ""}
      </div>

      <div class="admin-item-actions">

        <button class="btn secondary viewRegsBtn"
          data-id="${id}" data-name="${c.name}">
          View Registrants
        </button>

        <button class="btn secondary startListBtn"
          data-id="${id}" data-name="${c.name}">
          Create Start List
        </button>

        <button class="btn secondary editStartListBtn"
          data-id="${id}" data-name="${c.name}">
          Edit Start List
        </button>

        <button class="btn secondary enterResultsBtn"
          data-id="${id}" data-name="${c.name}">
          Enter Results
        </button>

        <button class="btn danger delComp" data-id="${id}">
          Delete
        </button>

      </div>
    `;

    compList.appendChild(li);
  });

  // DELETE COMPETITION
  document.querySelectorAll(".delComp").forEach((btn) => {
    btn.onclick = async () => {
      const compId = btn.dataset.id;
      if (!confirm("Delete this competition and all registrations?")) return;

      await deleteDoc(doc(db, "competitions", compId));

      // Remove all registrations linked to this comp
      const q1 = query(collection(db, "registrations"), where("compId", "==", compId));
      const snap1 = await getDocs(q1);
      snap1.forEach((d) => deleteDoc(doc(db, "registrations", d.id)));

      const q2 = query(collection(db, "competitionRegistrations"), where("competitionId", "==", compId));
      const snap2 = await getDocs(q2);
      snap2.forEach((d) => deleteDoc(doc(db, "competitionRegistrations", d.id)));

      alert("Competition deleted");
      loadCompetitions();
      loadRegistrations();
    };
  });

  // VIEW REGISTRANTS
  document.querySelectorAll(".viewRegsBtn").forEach((btn) => {
    btn.onclick = () => {
      const compId = btn.dataset.id;
      const compName = btn.dataset.name;

      window.location.href =
        `../admin/registrants/index.html?id=${encodeURIComponent(compId)}&name=${encodeURIComponent(compName)}`;
    };
  });

  // CREATE START LIST
  document.querySelectorAll(".startListBtn").forEach((btn) => {
    btn.onclick = () => {
      const compId = btn.dataset.id;
      const compName = btn.dataset.name;

      window.location.href =
        `startlist/index.html?comp=${encodeURIComponent(compId)}&name=${encodeURIComponent(compName)}`;
    };
  });

  // EDIT START LIST (NEW)
  document.querySelectorAll(".editStartListBtn").forEach((btn) => {
    btn.onclick = () => {
      const compId = btn.dataset.id;
      const compName = btn.dataset.name;

      window.location.href =
        `startlist/index.html?comp=${encodeURIComponent(compId)}&name=${encodeURIComponent(compName)}&edit=true`;
    };
  });

  // ENTER RESULTS
  document.querySelectorAll(".enterResultsBtn").forEach((btn) => {
    btn.onclick = () => {
      const compId = btn.dataset.id;
      const compName = btn.dataset.name;

      window.location.href =
        `results/index.html?comp=${encodeURIComponent(compId)}&name=${encodeURIComponent(compName)}`;
    };
  });
}

// =====================================================
// MEMBERS
// =====================================================
async function loadMembers() {
  memberList.innerHTML = "<li>Loading members…</li>";

  const snap = await getDocs(collection(db, "users"));

  memberList.innerHTML = "";

  if (snap.empty) {
    memberList.innerHTML = "<li>No members yet.</li>";
    return;
  }

  snap.forEach((docSnap) => {
    const u = docSnap.data();
    const id = docSnap.id;

    const photo = u.photoURL
      ? `<img src="${u.photoURL}" class="admin-thumb small circle">`
      : `<div class="admin-thumb small circle placeholder"></div>`;

    const li = document.createElement("li");
    li.classList.add("admin-item");
    li.innerHTML = `
      <div class="admin-item-body admin-member">
        ${photo}
        <div>
          <strong>${u.name || "No name"}</strong><br>
          <span class="muted small">${u.email}</span><br>

          <label class="muted small">Role:</label><br>
          <select class="member-role input small" data-id="${id}">
            <option value="member" ${u.role === "member" ? "selected" : ""}>Member</option>
            <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
        </div>
      </div>

      <div class="admin-item-actions">
        <button class="btn danger deleteMember" data-id="${id}">Delete</button>
      </div>
    `;

    memberList.appendChild(li);
  });

  document.querySelectorAll(".member-role").forEach((sel) => {
    sel.onchange = async () => {
      await updateDoc(doc(db, "users", sel.dataset.id), { role: sel.value });
      alert("Role updated.");
    };
  });

  document.querySelectorAll(".deleteMember").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete this member?")) return;

      await deleteDoc(doc(db, "users", btn.dataset.id));
      loadMembers();
    };
  });
}

// =====================================================
// REGISTRATIONS
// =====================================================
const userCache = {};

async function handleRegDecision(id, source, status, compId, userId) {
  const coll = source === "registrations" ? "registrations" : "competitionRegistrations";

  await updateDoc(doc(db, coll, id), {
    status,
    decidedAt: serverTimestamp()
  });

  if (status === "approved" && compId && userId) {
    await updateDoc(doc(db, "competitions", compId), {
      registeredUsers: arrayUnion(userId)
    });
  }

  loadRegistrations();
}

async function resolveRegProfile(r) {
  let name = r.memberName || r.guestName || r.name || "";
  let gender = r.memberGender || r.guestGender || r.gender || "Unknown";

  const uid = r.memberId || r.uid || r.userId || r.user || r.guestId || "";

  if (!uid) return { name: name || "Unknown athlete", gender };

  try {
    if (!userCache[uid]) {
      const snap = await getDoc(doc(db, "users", uid));
      userCache[uid] = snap.exists() ? snap.data() : null;
    }

    const u = userCache[uid] || {};

    return {
      name: u.name || name || "Unknown athlete",
      gender: u.gender || gender || "Unknown"
    };

  } catch (e) {
    return { name: name || "Unknown athlete", gender };
  }
}

async function loadRegistrations() {
  pendingRegs.innerHTML = "<li>Loading…</li>";
  regCache = [];

  try {
    const snap1 = await getDocs(collection(db, "registrations"));
    snap1.forEach((docSnap) => {
      regCache.push({
        id: docSnap.id,
        source: "registrations",
        ...docSnap.data()
      });
    });
  } catch (e) {
    console.error("registrations error", e);
  }

  try {
    const snap2 = await getDocs(collection(db, "competitionRegistrations"));
    snap2.forEach((docSnap) => {
      regCache.push({
        id: docSnap.id,
        source: "competitionRegistrations",
        ...docSnap.data()
      });
    });
  } catch (e) {
    console.error("competitionRegistrations error", e);
  }

  renderRegFilters();
  renderRegistrations();
}

function renderRegFilters() {
  const comps = [
    ...new Set(
      regCache
        .map(
          (r) => r.compId || r.competitionId || r.compName || r.competitionName
        )
        .filter(Boolean)
    )
  ];

  regCompFilter.innerHTML = `<option value="">All competitions</option>`;

  comps.forEach((key) => {
    const label =
      regCache.find(
        (r) =>
          r.compId === key ||
          r.competitionId === key ||
          r.compName === key ||
          r.competitionName === key
      )?.compName || key;

    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    regCompFilter.appendChild(opt);
  });
}

async function renderRegistrations() {
  const term = regSearch.value.trim().toLowerCase();
  const selectedComp = regCompFilter.value;

  const filtered = regCache.filter((r) => {
    const compKey =
      r.compId || r.competitionId || r.compName || r.competitionName || "";

    if (selectedComp && compKey !== selectedComp) return false;

    if (term) {
      const searchText = [
        r.memberName,
        r.memberEmail,
        r.guestName,
        r.guestEmail,
        r.name,
        r.email,
        Array.isArray(r.events) ? r.events.join(" ") : ""
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchText.includes(term)) return false;
    }

    return true;
  });

  pendingRegs.innerHTML = "";

  if (!filtered.length) {
    pendingRegs.innerHTML = "<li>No matching registrations.</li>";
    return;
  }

  for (const r of filtered) {
    const { name, gender } = await resolveRegProfile(r);

    const email =
      r.memberEmail || r.guestEmail || r.email || "";

    const compLabel =
      r.compName ||
      r.competitionName ||
      r.compId ||
      r.competitionId ||
      "N/A";

    const eventsText = Array.isArray(r.events) ? r.events.join(", ") : "";
    const status = r.status || "pending";

    const uid =
      r.uid ||
      r.memberId ||
      r.userId ||
      r.user ||
      r.guestId ||
      "";

    const li = document.createElement("li");
    li.classList.add("admin-item");

    let actions = "";

    if (status === "pending") {
      actions = `
        <button class="btn secondary approveReg"
          data-id="${r.id}"
          data-source="${r.source}"
          data-user="${uid}"
          data-comp="${r.compId || r.competitionId || ""}">
          Approve
        </button>

        <button class="btn danger rejectReg"
          data-id="${r.id}"
          data-source="${r.source}">
          Reject
        </button>
      `;
    } else {
      actions = `
        <button class="btn danger deleteReg"
          data-id="${r.id}"
          data-source="${r.source}">
          Delete
        </button>
      `;
    }

    li.innerHTML = `
      <div class="admin-item-body">
        <strong>${name}</strong><br>
        <span class="muted small">${email}</span><br>
        <span class="muted small">${compLabel} • ${eventsText}</span><br>
        <span class="muted small">Gender: ${gender}</span><br>
        <span class="muted small">Status: ${status}</span>
      </div>

      <div class="admin-item-actions">
        ${actions}
      </div>
    `;

    pendingRegs.appendChild(li);
  }

  document.querySelectorAll(".approveReg").forEach((btn) => {
    btn.onclick = async () => {
      await handleRegDecision(
        btn.dataset.id,
        btn.dataset.source,
        "approved",
        btn.dataset.comp,
        btn.dataset.user
      );
    };
  });

  document.querySelectorAll(".rejectReg").forEach((btn) => {
    btn.onclick = async () => {
      await handleRegDecision(btn.dataset.id, btn.dataset.source, "rejected");
    };
  });

  document.querySelectorAll(".deleteReg").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Delete this registration permanently?")) return;

      const coll =
        btn.dataset.source === "registrations"
          ? "registrations"
          : "competitionRegistrations";

      await deleteDoc(doc(db, coll, btn.dataset.id));
      loadRegistrations();
    };
  });
}

// =====================================================
// EXPORT CSV
// =====================================================
exportRegsCsv.onclick = () => {
  if (!regCache.length) return alert("Nothing to export.");

  const rows = regCache.map((r) => ({
    Name: r.memberName || r.guestName || r.name || "",
    Email: r.memberEmail || r.guestEmail || r.email || "",
    CompetitionId: r.compId || r.competitionId || "",
    CompetitionName: r.compName || r.competitionName || "",
    Events: Array.isArray(r.events) ? r.events.join(" | ") : "",
    Status: r.status || ""
  }));

  const header = Object.keys(rows[0]);

  const csv = [
    header.join(","),
    ...rows.map((row) =>
      header.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "competition_registrations.csv";
  a.click();
};

// =====================================================
// UI — TABS
// =====================================================
const tabButtons = document.querySelectorAll(".tab-btn");
const adminSections = document.querySelectorAll(".admin-section");

function showSection(name) {
  adminSections.forEach((sec) => {
    sec.style.display = sec.dataset.section === name ? "block" : "none";
  });

  tabButtons.forEach((btn) => {
    btn.classList.toggle("active-tab", btn.dataset.sectionBtn === name);
  });
}

tabButtons.forEach((btn) => {
  btn.onclick = () => showSection(btn.dataset.sectionBtn);
});

// Default
showSection("news");

// Filters
regSearch.oninput = () => renderRegistrations();
regCompFilter.onchange = () => renderRegistrations();

// =====================================================
// ENTER RESULTS BUTTON (SAFE)
// =====================================================
const goBtn = document.getElementById("goToResults");
if (goBtn) {
  goBtn.onclick = () => {
    window.location.href = "./results/index.html";
  };
}
// =====================================================
// 🚪 ADMIN LOGOUT (SECURE)
// =====================================================
const logoutBtn = document.getElementById("btnLogout");

if (logoutBtn) {
  logoutBtn.onclick = async () => {
    try {
      await signOut(auth);
    } finally {
      localStorage.removeItem("role");
      window.location.replace("../login/");
    }
  };
}
