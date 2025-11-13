import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

async function loadArticle() {
  const container = document.getElementById("newsArticle");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    container.innerHTML = "<p class='muted'>Invalid article link.</p>";
    return;
  }

  const ref = doc(db, "news", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    container.innerHTML = "<p class='muted'>Article not found.</p>";
    return;
  }

  const d = snap.data();

  container.innerHTML = `
    <img src="${d.imageURL}" style="width:100%;max-height:420px;object-fit:cover;border-radius:14px;">
    <h1 style="margin-top:1.5rem;">${d.title}</h1>
    <p class="muted" style="margin-top:.3rem;">
      ${d.createdAt ? d.createdAt.toDate().toLocaleDateString() : ""}
    </p>
    <p style="margin-top:1.4rem;line-height:1.6;font-size:1rem;">
      ${d.desc ? d.desc.replace(/\n/g, "<br>") : ""}
    </p>
  `;
}

document.addEventListener("DOMContentLoaded", loadArticle);
