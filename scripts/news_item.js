import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: window.env.FIREBASE_API_KEY,
  authDomain: window.env.FIREBASE_AUTH_DOMAIN,
  projectId: window.env.FIREBASE_PROJECT_ID,
  storageBucket: window.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.env.FIREBASE_APP_ID,
  measurementId: window.env.FIREBASE_MEASUREMENT_ID
};


console.log("✅ Script Loaded");

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadArticle() {
  console.log("✅ loadArticle() running");

  const container = document.getElementById("newsArticle");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  console.log("🆔 Article ID:", id);

  if (!id) {
    container.innerHTML = "<p class='muted'>Invalid article link (no ID found).</p>";
    return;
  }

  const ref = doc(db, "news", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    container.innerHTML = "<p class='muted'>Article not found in Firestore.</p>";
    return;
  }

  const d = snap.data();
  console.log("📄 Article Data:", d);

  container.innerHTML = `
    <img src="${d.imageURL}" style="width:100%;max-height:420px;object-fit:cover;border-radius:14px;">
    <h1 style="margin-top:1.5rem;">${d.title}</h1>
    <p class="muted" style="margin-top:.3rem;">
      ${d.createdAt ? d.createdAt.toDate().toLocaleDateString() : ""}
    </p>
    <p style="margin-top:1.4rem;line-height:1.6;font-size:1rem;">
      ${(d.desc || d.description || "").replace(/\n/g, "<br>")}
    </p>
  `;
}

document.addEventListener("DOMContentLoaded", loadArticle);

