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
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.appspot.com",
  messagingSenderId: "382189793627",
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e",
  measurementId: "G-K059EW003Z"
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
