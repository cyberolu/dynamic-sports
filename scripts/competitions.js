import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
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

async function loadCompetitions() {
  const container = document.getElementById("competitionsDisplay");
  container.innerHTML = "<p class='muted'>Loading competitions…</p>";

  const q = query(collection(db, "competitions"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "<p class='muted'>No competitions listed yet.</p>";
    return;
  }

  container.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();
    container.innerHTML += `
      <div class="news-card" onclick="window.location='competition_item.html?id=${doc.id}'">
        <img src="${d.imageURL}" alt="${d.name}">
        <div>
          <h3>${d.name}</h3>
          <p>${d.date} • ${d.location}</p>
        </div>
      </div>
    `;
  });
}

document.addEventListener("DOMContentLoaded", loadCompetitions);
