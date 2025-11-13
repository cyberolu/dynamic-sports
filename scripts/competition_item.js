import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
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

async function loadCompetition() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const container = document.getElementById("competitionArticle");

  const ref = doc(db, "competitions", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    container.innerHTML = "<p class='muted'>Competition not found.</p>";
    return;
  }

  const d = snap.data();

  container.innerHTML = `
    <div class="article-page">
      <img src="${d.imageURL}" class="article-image">
      <h2>${d.name}</h2>
      <p><b>Date:</b> ${d.date}</p>
      <p><b>Location:</b> ${d.location}</p>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", loadCompetition);
