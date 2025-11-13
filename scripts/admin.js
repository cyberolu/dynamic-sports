// ==========================================
// 🛠️ ADMIN DASHBOARD — Manage News, Competitions & Members
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc, getDoc, updateDoc 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDN3wngm8ijH9ZMHMp-hLbqX3-C-FJcKmE",
  authDomain: "dynamicsports-c58a2.firebaseapp.com",
  projectId: "dynamicsports-c58a2",
  storageBucket: "dynamicsports-c58a2.appspot.com",
  messagingSenderId: "382189793627",
  appId: "1:382189793627:web:6e33d84329f5b40908aa7e",
  measurementId: "G-K059EW003Z"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ CLOUDINARY PRESETS
const CLOUDINARY_PRESET_NEWS = "dynamicnews";
const CLOUDINARY_PRESET_COMP = "dynamiccompetitions";

// ✅ Cloudinary Upload Function
async function uploadToCloudinary(file, preset) {
  const url = "https://api.cloudinary.com/v1_1/ddiwzcu9j/image/upload";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed");
  return data.secure_url;
}

// DOM Elements
const adminMsg = document.getElementById("adminMsg");
const logoutBtn = document.getElementById("logoutBtn");
const newsList = document.getElementById("newsList");
const compList = document.getElementById("compList");

// Competition fields
const compName = document.getElementById("compName");
const compDate = document.getElementById("compDate");
const compLocation = document.getElementById("compLocation");
const compImage = document.getElementById("compImage");
const addCompBtn = document.getElementById("addCompBtn");

// ==============================
// 🔐 AUTH CHECK
// ==============================
onAuthStateChanged(auth, async (user) => {
  if (!user) return (window.location.href = "../login.html");

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists() || userSnap.data().role !== "admin") {
    return (window.location.href = "../members.html");
  }

  adminMsg.textContent = `Welcome back, ${user.email}!`;
  loadNews();
  loadCompetitions();
  loadMembers(); // ✅ Load members once logged in
});

// ==============================
// 📰 ADD NEWS (Image Optional)
// ==============================
document.getElementById("addNewsBtn").addEventListener("click", async () => {
  const title = document.getElementById("newsTitle").value.trim();
  const desc = document.getElementById("newsDesc").value.trim();
  const imageFile = document.getElementById("newsImage").files[0];

  if (!title || !desc) {
    alert("Please fill in the title and description.");
    return;
  }

  let imageURL = "";
  if (imageFile) {
    try {
      imageURL = await uploadToCloudinary(imageFile, CLOUDINARY_PRESET_NEWS);
    } catch {
      alert("Image upload failed. You can still post without it.");
    }
  }

  await addDoc(collection(db, "news"), {
    title,
    desc,
    imageURL: imageURL || null,
    createdAt: serverTimestamp()
  });

  document.getElementById("newsTitle").value = "";
  document.getElementById("newsDesc").value = "";
  document.getElementById("newsImage").value = "";
  loadNews();
});

// ==============================
// 📰 LOAD & EDIT NEWS
// ==============================
async function loadNews() {
  newsList.innerHTML = "";
  const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;

    const li = document.createElement("li");
    li.innerHTML = `
      ${data.imageURL ? `<img src="${data.imageURL}" style="max-width:120px; border-radius:6px;">` : "<div style='width:120px;height:80px;background:#333;border-radius:6px;color:#999;display:flex;align-items:center;justify-content:center;'>No image</div>"}
      <input value="${data.title}" data-field="title" data-id="${id}">
      <textarea data-field="desc" data-id="${id}">${data.desc}</textarea>
      <input type="file" data-field="image" data-id="${id}">
      <button class="saveNews" data-id="${id}">Save</button>
      <button class="delNews" data-id="${id}">Delete</button>
    `;

    newsList.appendChild(li);
  });

  document.querySelectorAll(".saveNews").forEach(btn =>
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const title = document.querySelector(`input[data-field="title"][data-id="${id}"]`).value;
      const desc = document.querySelector(`textarea[data-field="desc"][data-id="${id}"]`).value;
      const newImage = document.querySelector(`input[data-field="image"][data-id="${id}"]`).files[0];

      let update = { title, desc };
      if (newImage) {
        try {
          update.imageURL = await uploadToCloudinary(newImage, CLOUDINARY_PRESET_NEWS);
        } catch {
          alert("Failed to upload new image.");
        }
      }

      await updateDoc(doc(db, "news", id), update);
      loadNews();
    }
  );

  document.querySelectorAll(".delNews").forEach(btn =>
    btn.onclick = async () => {
      await deleteDoc(doc(db, "news", btn.dataset.id));
      loadNews();
    }
  );
}

// ==============================
// 🏆 COMPETITIONS (Image Optional)
// ==============================
addCompBtn.onclick = async () => {
  if (!compName.value || !compDate.value || !compLocation.value) {
    alert("Please fill in competition name, date, and location.");
    return;
  }

  let imageURL = "";
  if (compImage.files[0]) {
    try {
      imageURL = await uploadToCloudinary(compImage.files[0], CLOUDINARY_PRESET_COMP);
    } catch {
      alert("Image upload failed. Competition will be posted without image.");
    }
  }

  await addDoc(collection(db, "competitions"), {
    name: compName.value,
    date: compDate.value,
    location: compLocation.value,
    imageURL: imageURL || null,
    createdAt: serverTimestamp()
  });

  compName.value = compDate.value = compLocation.value = compImage.value = "";
  loadCompetitions();
};

async function loadCompetitions() {
  compList.innerHTML = "";
  const q = query(collection(db, "competitions"), orderBy("date", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const c = docSnap.data();
    const id = docSnap.id;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${c.name}</strong> — ${c.date} — ${c.location}
      ${c.imageURL ? `<img src="${c.imageURL}" style="max-width:100px;margin-left:10px;border-radius:4px;">` : ""}
      <button class="delComp" data-id="${id}">Delete</button>
    `;
    compList.appendChild(li);
  });

  document.querySelectorAll(".delComp").forEach(btn =>
    btn.onclick = async () => {
      await deleteDoc(doc(db, "competitions", btn.dataset.id));
      loadCompetitions();
    }
  );
}

// ==============================
// 👤 MANAGE MEMBERS
// ==============================
async function loadMembers() {
  const memberList = document.getElementById("memberList");
  if (!memberList) return;

  memberList.innerHTML = "<p>Loading members...</p>";

  const snapshot = await getDocs(collection(db, "users"));
  memberList.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const id = docSnap.id;

    const li = document.createElement("li");
    const photo = user.photoURL
      ? `<img src="${user.photoURL}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;margin-right:10px;">`
      : `<div style="width:50px;height:50px;border-radius:50%;background:#ccc;margin-right:10px;"></div>`;

    li.innerHTML = `
      <div style="display:flex;align-items:center;margin-bottom:10px;">
        ${photo}
        <div>
          <strong>${user.name || "Unnamed"}</strong><br>
          <small>${user.email || "No email"}</small><br>
          <label>Role:</label>
          <select data-id="${id}" class="member-role">
            <option value="member" ${user.role === "member" ? "selected" : ""}>Member</option>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
          </select>
          <button class="deleteMember" data-id="${id}" style="margin-left:10px;">Delete</button>
        </div>
      </div>
    `;
    memberList.appendChild(li);
  });

  // 🔄 Role Change Handler
  document.querySelectorAll(".member-role").forEach(select => {
    select.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const newRole = e.target.value;
      await updateDoc(doc(db, "users", id), { role: newRole });
      alert("Role updated successfully!");
    });
  });

  // ❌ Delete Handler
  document.querySelectorAll(".deleteMember").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this member?")) {
        await deleteDoc(doc(db, "users", btn.dataset.id));
        loadMembers();
      }
    });
  });
}

// ==============================
// 🚪 LOGOUT
// ==============================
logoutBtn.onclick = async () => {
  await signOut(auth);
  window.location.href = "../login.html";
};
