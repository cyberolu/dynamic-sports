import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc
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
