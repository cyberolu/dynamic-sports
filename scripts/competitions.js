import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
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
