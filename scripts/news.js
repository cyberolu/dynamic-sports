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
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// 📰 LOAD NEWS
// ==========================================
async function loadNews() {
  const container = document.getElementById("newsDisplay");
  if (!container) return;

  container.innerHTML = "<p class='muted'>Loading news…</p>";

  try {
    const q = query(
      collection(db, "news"),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = "<p class='muted'>No news posted yet.</p>";
      return;
    }

    container.innerHTML = "";

    snap.forEach((docSnap) => {
      const d = docSnap.data();

      const desc = (d.desc || "").trim();
      const preview =
        desc.length > 100 ? `${desc.substring(0, 100)}…` : desc;

      const slug = d.slug || docSnap.id;

      container.innerHTML += `
        <div class="news-thumb"
            onclick="window.location.href='/news/${slug}'">

          <img src="${d.imageURL || 'assets/default-avatar.png'}"
               class="news-image"
               alt="${d.title}">

          <div class="news-info">
            <h3>${d.title || "Untitled"}</h3>
            <p>${preview}</p>
          </div>

        </div>
      `;
    });

  } catch (err) {
    console.error("Failed to load news:", err);
    container.innerHTML = "<p class='muted'>Failed to load news.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadNews);