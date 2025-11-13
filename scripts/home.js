// ==========================================
// 🏠 HOME PAGE — Latest News Section
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, limit, getDocs } 
  from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✅ Firebase Configuration (same across all scripts)
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.firebasestorage.app",
  messagingSenderId: "382189793627",
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e",
  measurementId: "G-K059EW003Z"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Function to load latest news
async function loadLatestNews() {
  const newsContainer = document.getElementById("latestNews");
  if (!newsContainer) return;

  newsContainer.innerHTML = "<p class='muted'>Loading latest updates...</p>";

  try {
    const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      newsContainer.innerHTML = "<p class='muted'>No news available yet.</p>";
      return;
    }

    newsContainer.innerHTML = ""; // Clear placeholder

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const card = document.createElement("div");
      card.classList.add("card");
      card.style.marginBottom = "1.5rem";
      card.innerHTML = `
        <img src="${data.imageURL}" alt="${data.title}" style="max-width:100%; border-radius:8px;">
        <h2>${data.title}</h2>
        <p>${data.desc.substring(0, 120)}...</p>
        <a href="news.html" class="tab">Read More</a>
      `;
      newsContainer.appendChild(card);
    });
  } catch (error) {
    console.error("Failed to load news:", error);
    newsContainer.innerHTML = "<p class='muted'>Failed to load news. Please try again later.</p>";
  }
}

// ✅ Run once page is loaded
document.addEventListener("DOMContentLoaded", loadLatestNews);
