// ==========================================
// 🏠 HOME PAGE — Latest News + Competitions
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase Config
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

// Helper — safe image renderer
function safeImage(url) {
  if (!url || url === "null" || url === null || url === undefined) {
    return `<div class="no-image" style="
      width:120px;
      height:120px;
      background:#222;
      border-radius:10px;
      display:flex;
      align-items:center;
      justify-content:center;
      color:#666;
      font-size:0.8rem;
    ">No Image</div>`;
  }
  return `<img src="${url}" alt="" />`;
}

// ==========================================
// 📰 LOAD LATEST NEWS
// ==========================================
async function loadLatestNews() {
  const newsContainer = document.getElementById("latestNews");
  if (!newsContainer) return;

  newsContainer.innerHTML = "<p class='muted'>Loading latest updates...</p>";

  try {
    const q = query(
      collection(db, "news"),
      orderBy("createdAt", "desc"),
      limit(3)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      newsContainer.innerHTML = "<p class='muted'>No news available yet.</p>";
      return;
    }

    newsContainer.innerHTML = "";

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
     


      newsContainer.innerHTML += `
        <div class="news-thumb"
            onclick="window.location.href='/news_item/index.html?slug=${d.slug || docSnap.id}'">

          <img src="${d.imageURL || 'assets/default-avatar.png'}" 
              class="news-image"
              alt="${d.title}">

          <div class="news-info">
            <h3>${d.title}</h3>
            <p>${(d.desc || "").substring(0, 120)}...</p>
          </div>

        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    newsContainer.innerHTML = "<p class='muted'>Failed to load news.</p>";
  }
}

// ==========================================
// 🏅 LOAD COMPETITIONS
// ==========================================
async function loadCompetitions() {
  const list = document.getElementById("homeComps");
  if (!list) return;

  list.innerHTML = "<div class='muted'>Loading competitions...</div>";

  try {
    const q = query(collection(db, "competitions"), orderBy("createdAt", "desc"), limit(5));
    const snap = await getDocs(q);

    if (snap.empty) {
      list.innerHTML = "<div class='muted'>No competitions listed yet.</div>";
      return;
    }

    list.innerHTML = "";
    snap.forEach(docSnap => {
      const d = docSnap.data();

      list.innerHTML += `
        <div class="news-thumb" onclick="window.location.href='competition_item/index.html?id=${docSnap.id}'">
          <img src="${d.imageURL}" class="news-image" alt="${d.title}">
          <div class="news-info">
            <h3>${d.name}</h3>
            <p>${d.date} — ${d.location}</p>
          </div>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
    list.innerHTML = "<div class='muted'>Failed to load competitions.</div>";
  }
}


// RUN
document.addEventListener("DOMContentLoaded", () => {
  loadLatestNews();
  loadCompetitions();
});
