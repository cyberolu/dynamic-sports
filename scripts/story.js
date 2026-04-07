// ==========================================
// 📰 STORY PAGE — CLIENT RENDERER (FINAL)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
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
// 📌 GET SLUG FROM URL
// ==========================================
let slug = null;

const path = window.location.pathname;
const cleanPath = path.endsWith("/") ? path.slice(0, -1) : path;
const parts = cleanPath.split("/");
slug = parts[parts.length - 1];

// fallback (?id=)
if (!slug || slug === "news_item" || slug === "index.html") {
  const params = new URLSearchParams(window.location.search);

  // ✅ FIX: read slug properly
  slug = params.get("slug") || params.get("id");
}

const root = document.getElementById("app");

if (!slug) {
  root.innerHTML = "<p class='muted'>Story not found.</p>";
  throw new Error("Missing slug");
}

// ==========================================
// 🔎 FETCH STORY (FAST + RELIABLE)
// ==========================================
let story = null;

// 1️⃣ Try slug
const slugQuery = query(
  collection(db, "news"),
  where("slug", "==", slug)
);

const slugSnap = await getDocs(slugQuery);

if (!slugSnap.empty) {
  story = slugSnap.docs[0].data();
} else {
  // 2️⃣ fallback: direct document ID
  const docRef = doc(db, "news", slug);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    story = docSnap.data();
  }
}

if (!story) {
  root.innerHTML = "<p class='muted'>Story not found.</p>";
  throw new Error("No matching story");
}

// ==========================================
// 🧱 RENDER STORY
// ==========================================

// Safe image selection
const image =
  story.featuredImage ||
  story.imageURL ||
  story.image ||
  "";

// Safe date
const date =
  story.createdAt?.toDate
    ? story.createdAt.toDate().toLocaleDateString()
    : "";

// Content fallback
const content =
  (story.content || story.desc || "").replace(/\n/g, "<br>");

root.innerHTML = `
  <main class="wrap">
    <article class="card news-story">

      <h1>${story.title || "Untitled"}</h1>

      ${date ? `<p class="muted small">${date}</p>` : ""}

      ${image ? `<img class="news-full-image" src="${image}" alt="${story.title}">` : ""}

      <div class="news-content">
        ${content}
      </div>

    </article>

    <div class="back-wrapper">
      <a href="/news.html" class="back-bottom">← Back to News</a>
    </div>
  </main>
`;

// ==========================================
// 🧭 NAV LOAD
// ==========================================
import("../scripts/nav.js");

// ==========================================
// 🔗 SHARE BUTTON (CORRECT DOMAIN)
// ==========================================
const shareBtn = document.getElementById("shareBtn");

if (shareBtn) {
  shareBtn.onclick = async () => {
    const url = `https://www.dynamic-athletics.com/news/${slug}`;

    try {
      await navigator.clipboard.writeText(url);
      alert("Story link copied!");
    } catch {
      alert(url);
    }
  };
}