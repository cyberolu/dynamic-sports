// HOMEPAGE DATA LOADING

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: window.env.FIREBASE_API_KEY,
  authDomain: window.env.FIREBASE_AUTH_DOMAIN,
  projectId: window.env.FIREBASE_PROJECT_ID,
  storageBucket: window.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: window.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: window.env.FIREBASE_APP_ID,
  measurementId: window.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// LOAD LATEST NEWS (THUMBNAIL STYLE)
async function loadNews() {
  const container = document.getElementById("homeNews");
  if (!container) return;

  container.innerHTML = "<p class='muted'>Loading latest news...</p>";

  const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3));
  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "<p class='muted'>No news available yet.</p>";
    return;
  }

  container.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();

    container.innerHTML += `
      <div class="news-thumb" onclick="window.location.href='news.html?id=${doc.id}'">
        <img src="${d.imageURL}" alt="${d.title}">
        <div class="news-info">
          <h3>${d.title}</h3>
          <p>${d.desc.substring(0, 80)}...</p>
        </div>
      </div>
    `;
  });
}

// LOAD UPCOMING COMPETITIONS (TEXT LIST)
async function loadCompetitions() {
  const list = document.getElementById("homeComps");
  if (!list) return;

  list.innerHTML = "<li class='muted'>Loading competitions...</li>";

  const q = query(collection(db, "competitions"), orderBy("createdAt", "desc"), limit(5));
  const snap = await getDocs(q);

  if (snap.empty) {
    list.innerHTML = "<li class='muted'>No competitions listed yet.</li>";
    return;
  }

  list.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();
    list.innerHTML += `
      <li onclick="window.location.href='competition.html?id=${doc.id}'">
        <strong>${d.name}</strong> — ${d.date} @ ${d.location}
      </li>
    `;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadNews();
  loadCompetitions();
});
