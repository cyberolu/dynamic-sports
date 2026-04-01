// ==========================================
// 📰 STORY PAGE — CLIENT RENDERER (SLUG BASED)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ==========================================
// 🔐 Firebase config
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.appspot.com",
  messagingSenderId: "382189793627",
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 📌 Read slug from URL
// ==========================================
let slug = null;

// CLEAN URL SUPPORT
const path = window.location.pathname;

// remove trailing slash
const cleanPath = path.endsWith("/") ? path.slice(0, -1) : path;

// split path
const parts = cleanPath.split("/");
slug = parts[parts.length - 1];

// fallback for old ?id=
if (!slug || slug === "news_item" || slug === "index.html") {
  const params = new URLSearchParams(window.location.search);
  slug = params.get("id");
}

// root container (ONLY ONCE)
const root = document.getElementById("app");

if (!slug) {
  root.innerHTML = "<p class='muted'>Story not found.</p>";
  throw new Error("Missing slug");
}

// ==========================================
// 🔎 Fetch story from Firestore
// ==========================================
const q = query(
  collection(db, "news"),
  where("__name__", "==", slug)
);

const snap = await getDocs(q);

if (snap.empty) {
  root.innerHTML = "<p class='muted'>Story not found.</p>";
  throw new Error("No matching story");
}

const story = snap.docs[0].data();

// ==========================================
// 🧱 Render page (STRUCTURE MATTERS)
// ==========================================
root.innerHTML = `

  <!-- STORY -->
  <main class="wrap">
    <article class="card news-story">
      <h1>${story.title || "Untitled"}</h1>

      ${
        story.createdAt?.toDate
          ? `<p class="muted small">
               ${story.createdAt.toDate().toLocaleDateString()}
             </p>`
          : ""
      }

      ${story.featuredImage 
        ? `<img class="news-full-image" src="${story.featuredImage}" alt="${story.title}">`
        : story.imageURL && !story.imageURL.includes("logo")
        ? `<img class="news-full-image" src="${story.imageURL}" alt="${story.title}">`
        : ""
      }

      <div class="news-content">
        ${(story.content || story.desc || "")
          .replace(/\n/g, "<br>")}
      </div>
    </article>

    <!-- ✅ BACK BUTTON — FIXED POSITION -->
    <div class="back-wrapper">
      <a href="/news/" class="back-bottom">← Back to News</a>
    </div>
  </main>
`;

// ==========================================
// 🧭 Load nav AFTER DOM exists
// ==========================================
import("../scripts/nav.js");

// ==========================================
// 🔗 Optional share support (clipboard-safe)
// ==========================================
const shareBtn = document.getElementById("shareBtn");
if (shareBtn) {
  shareBtn.onclick = async () => {
    const url = `https://www.dynamic-athletics.com/news/${slug}`;
    await navigator.clipboard.writeText(url);
    alert("Story link copied!");
  };
}
