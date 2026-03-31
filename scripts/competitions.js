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
const COMPETITIONS_MAINTENANCE = true;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// LOAD COMPETITIONS
async function loadCompetitions() {
  const container = document.getElementById("competitionsDisplay");

  if (COMPETITIONS_MAINTENANCE) {
    container.innerHTML = `
      <div class="news-card">
        <div>
          <h3>Competitions Under Maintenance</h3>
          <p>Upcoming competitions will be announced soon.</p>
        </div>
      </div>
    `;
    return;
  }

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
  <div class="news-card">
    <img src="${d.imageURL || ''}" alt="${d.name}">
    <div>
      <h3>${d.name}</h3>
      <p>${d.date} • ${d.location}</p>

      <button 
        class="btn shareCompBtn"
        data-id="${doc.id}"
        data-name="${d.name}">
        Share
      </button>

      <a href="../registrant/index.html?id=${doc.id}" class="btn">
        Registered Athletes
      </a>

    <a href="../startlist/index.html?comp=${doc.id}" class="btn">
  Start List
</a>

      <a href="../competition_item/index.html?id=${doc.id}" class="btn">
        View
      </a>
    </div>
  </div>
`;


  });

  enableCompetitionSharing();
}

// SHARE FUNCTION
function enableCompetitionSharing() {
  document.querySelectorAll(".shareCompBtn").forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();

      const compId = btn.dataset.id;
      const compName = btn.dataset.name;

      const shareUrl = `${window.location.origin}/competition_item/index.html?id=${compId}`;

      const shareData = {
        title: compName,
        text: `Check out the ${compName} competition on Dynamic Sports!`,
        url: shareUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    };
  });
}

document.addEventListener("DOMContentLoaded", loadCompetitions);
