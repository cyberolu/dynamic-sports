// ✅ Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";
import { setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";


// ✅ Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBb10m7bvdQb0_u6ZMCjBDy_pTlsv-YSlQ",
  authDomain: "dynamic-athletics.firebaseapp.com",
  projectId: "dynamic-athletics",
  storageBucket: "dynamic-athletics.appspot.com",
  messagingSenderId: "43664322463",
  appId: "1:43664322463:web:f56e8d9a29da4f50f297aa",
  measurementId: "G-NWMT0ZGSRC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const API_URL = "https://dynamic.fly.dev/api"; // ✅ Use your deployed domain



// ✅ Make Firebase globally accessible
window.db = db;
window.storage = storage;
window.auth = auth;

// ✅ Helper Function: Upload File
async function uploadFile(file, path) {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

// ✅ Validate Admin Login with Firebase
console.log("⚡ Login button clicked");

function validateLogin() {
    let email = document.getElementById("adminEmail").value.trim();
    let password = document.getElementById("adminPassword").value.trim();
   

  
    if (!email || !password) {
      alert("⚠️ Please enter an email and password.");
      return;
    }
  
    setPersistence(auth, browserSessionPersistence)  // Ensures session persistence
      .then(() => {
        return signInWithEmailAndPassword(auth, email, password);
      })
      .then((userCredential) => {
        console.log("✅ Login successful:", userCredential.user);
        alert("✅ Login successful!");
  
        sessionStorage.setItem("isAdmin", "true");
        window.location.href = "admin.html"; // Redirect to admin panel
      })
      .catch((error) => {
        console.error("❌ Login failed:", error.message);
        alert("❌ Incorrect email or password. Try again.");
      });
  }
  window.validateLogin = validateLogin;

// ✅ Check If Admin Is Logged In
function checkLogin() {
    let loginModal = document.getElementById("loginModal");
    let adminContent = document.getElementById("adminContent");
  
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ Admin logged in:", user.email);
        sessionStorage.setItem("isAdmin", "true");  // Store session
        if (loginModal) loginModal.style.display = "none";
        if (adminContent) adminContent.style.display = "block";
      } else {
        console.warn("🚫 Admin not logged in - Showing login modal.");
        sessionStorage.removeItem("isAdmin");  // Ensure session is removed
        if (loginModal) loginModal.style.display = "block";
        if (adminContent) adminContent.style.display = "none";
      }
    });
  }
  window.checkLogin = checkLogin;

// ✅ Logout Admin
function logout() {
    signOut(auth)
      .then(() => {
        sessionStorage.removeItem("isAdmin");  // Clear session
        alert("✅ Logged out successfully.");
        window.location.href = "index.html";  // Redirect after logout
      })
      .catch((error) => {
        console.error("❌ Logout failed:", error.message);
      });
  }
  window.logout = logout;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginButton").addEventListener("click", validateLogin);
});

// ----------------------------------------
// ✅ NEWS MANAGEMENT (Firestore)
// ----------------------------------------
// ✅ Fetch and Display News for Both Admin and Public Pages
async function fetchNews() {
    try {
        let response = await fetch(`${API_URL}/news`);
        let newsData = await response.json();

        console.log("✅ News Fetched:", newsData); // Debugging log

        let adminNewsContainer = document.getElementById("adminNewsDisplay");
        let publicNewsContainer = document.getElementById("newsDisplay");

        if (!adminNewsContainer && !publicNewsContainer) {
            console.error("❌ No news containers found!");
            return;
        }

        if (adminNewsContainer) adminNewsContainer.innerHTML = "";
        if (publicNewsContainer) publicNewsContainer.innerHTML = "";

        if (newsData.length === 0) {
            if (adminNewsContainer) adminNewsContainer.innerHTML = "<p>No news available.</p>";
            if (publicNewsContainer) publicNewsContainer.innerHTML = "<p>No news available.</p>";
            return;
        }

        newsData.forEach(news => {
            let newsElement = `
                <div class="news-item">
                    <h3>${news.title}</h3>
                    <p>${news.content}</p>
                    ${news.image_url ? `<img src="${news.image_url}" width="200px">` : ""}
                    ${adminNewsContainer ? `<button onclick="deleteNews(${news.id})">Delete</button>` : ""}
                </div>
            `;

            if (adminNewsContainer) adminNewsContainer.innerHTML += newsElement;
            if (publicNewsContainer) publicNewsContainer.innerHTML += newsElement;
        });

        console.log("✅ News Displayed Successfully");
    } catch (error) {
        console.error("❌ Error fetching news:", error);
    }
}

// ✅ Save News (Admin Panel)
async function saveNews() {
    let newsTitle = document.getElementById("newsTitle").value.trim();
    let newsContent = document.getElementById("newsText").value.trim();
    let newsImageFile = document.getElementById("newsImageFile").files[0];

    if (!newsTitle || !newsContent) {
        alert("⚠️ Please enter a news title and content.");
        return;
    }

    let formData = new FormData();
    formData.append("title", newsTitle);
    formData.append("content", newsContent);

    if (newsImageFile) {
        formData.append("image", newsImageFile);
    }

    try {
        let response = await fetch(`${API_URL}/upload-news`, {
            method: "POST",
            body: formData,
        });

        let data = await response.json();
        if (response.ok) {
            alert("✅ News uploaded successfully!");
            fetchNews(); // Refresh news list
        } else {
            throw new Error(data.message || "News upload failed.");
        }
    } catch (error) {
        console.error("❌ Error uploading news:", error);
        alert("❌ Failed to upload news.");
    }
}
window.saveNews = saveNews;

// ✅ Upload File to Firebase Storage
async function uploadFile(file, path) {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("❌ Error uploading file to Firebase:", error);
        throw error;
    }
}

// ✅ Delete News (Admin Panel)
async function deleteNews(newsId) {
    if (!confirm("Are you sure you want to delete this news?")) return;

    try {
        let response = await fetch(`${API_URL}/news/${newsId}`, { method: "DELETE" });
        let data = await response.json();

        if (response.ok) {
            alert("🗑 News deleted successfully!");
            fetchNews(); // Refresh news list
        } else {
            throw new Error(data.message || "Delete failed.");
        }
    } catch (error) {
        console.error("❌ Error deleting news:", error);
        alert("❌ Failed to delete news.");
    }
}
window.deleteNews = deleteNews;

// ✅ Load News on Page Load
document.addEventListener("DOMContentLoaded", () => {
    fetchNews();
});


// ----------------------------------------
// ✅ RESULTS MANAGEMENT (SQL via API)
// ----------------------------------------

// ✅ API Endpoint

// ✅ Ensure Functions Run on Page Load
// ✅ Fetch and Display Results
async function displayResults() {
    let resultsContainer = document.getElementById("resultsDisplay") || document.getElementById("adminResultsDisplay");
    if (!resultsContainer) {
        console.error("❌ Results container not found.");
        return;
    }

    resultsContainer.innerHTML = "<p>Loading results...</p>";

    try {
        let response = await fetch(`${API_URL}/results`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        let results = await response.json();
        console.log("✅ Results Fetched:", results); // Debugging Log

        if (results.length === 0) {
            resultsContainer.innerHTML = "<p>No results available.</p>";
            return;
        }

        resultsContainer.innerHTML = "";
        let resultsByYear = {};

        results.forEach((result) => {
            let { id, file_name, file_url, year } = result;

            if (!resultsByYear[year]) {
                resultsByYear[year] = [];
            }

            resultsByYear[year].push({ id, name: file_name, url: file_url });
        });

        // ✅ Sort results by year (latest first)
        Object.keys(resultsByYear).sort((a, b) => b - a).forEach(year => {
            let yearSection = document.createElement("div");
            yearSection.innerHTML = `<h3>${year} Competition Results</h3>`;

            resultsByYear[year].forEach((file) => {
                let resultEntry = document.createElement("p");
                resultEntry.innerHTML = `
                    <a href="${file.url}" download>${file.name}</a> 
                    ${document.getElementById("adminResultsDisplay") ? `<button onclick="deleteResult(${file.id})">Delete</button>` : ""}
                `;
                yearSection.appendChild(resultEntry);
            });

            resultsContainer.appendChild(yearSection);
        });

        console.log("✅ Results Displayed Successfully");
    } catch (error) {
        console.error("❌ Error fetching results:", error);
        resultsContainer.innerHTML = "<p>Error loading results.</p>";
    }
}
window.displayResults = displayResults; // ✅ Ensure function is globally accessible

// ✅ Upload Results
async function saveResults() {
    let resultsFile = document.getElementById("resultsFile").files[0];
    let selectedYear = document.getElementById("resultYear").value;

    if (!resultsFile || !selectedYear) {
        alert("⚠️ Please select a year and a results file.");
        return;
    }

    let formData = new FormData();
    formData.append("file", resultsFile);
    formData.append("year", selectedYear);

    try {
        let response = await fetch(`${API_URL}/upload`, {
            method: "POST",
            body: formData,
        });

        let data = await response.json();
        if (response.ok) {
            alert("✅ Results uploaded successfully!");
            displayResults(); // ✅ Refresh results list
        } else {
            throw new Error(data.message || "Upload failed.");
        }
    } catch (error) {
        console.error("❌ Error uploading result:", error);
        alert("❌ Failed to upload results.");
    }
}
window.saveResults = saveResults;

// ✅ Populate Year Dropdown
function populateYearDropdowns() {
    let currentYear = new Date().getFullYear(); // ✅ Get current year
    let pastYears = 5;
    let futureYears = 5;  // ✅ Number of future years to add
    let dropdown = document.getElementById("resultYear");

    if (!dropdown) {
        console.error("❌ Year dropdown not found!");
        return;
    }

    dropdown.innerHTML = ""; // ✅ Clear any existing options

    // ✅ Populate the dropdown with past and future years
    for (let year = currentYear - pastYears; year <= currentYear + futureYears; year++) {
        let option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        dropdown.appendChild(option);
    }

    console.log("📅 Year dropdown populated:", dropdown.innerHTML);
}
window.populateYearDropdowns = populateYearDropdowns; // ✅ Ensure function is globally accessible

async function saveNews() {
    let newsTitle = document.getElementById("newsTitle").value.trim();
    let newsContent = document.getElementById("newsText").value.trim();
    let newsImageFile = document.getElementById("newsImageFile").files[0];

    if (!newsTitle || !newsContent) {
        alert("⚠️ Please enter a news title and content.");
        return;
    }

    let formData = new FormData();
    formData.append("title", newsTitle);
    formData.append("content", newsContent);

    if (newsImageFile) {
        const storagePath = `news/${Date.now()}_${newsImageFile.name}`;
        const imageUrl = await uploadFile(newsImageFile, storagePath);
        formData.append("image_url", imageUrl);
    }

    try {
        let response = await fetch(`${API_URL}/upload-news`, {
            method: "POST",
            body: formData,
        });

        let data = await response.json();
        if (response.ok) {
            alert("✅ News uploaded successfully!");
            fetchNews();
        } else {
            throw new Error(data.message || "News upload failed.");
        }
    } catch (error) {
        console.error("❌ Error uploading news:", error);
        alert("❌ Failed to upload news.");
    }
}
window.saveNews = saveNews;

// ✅ Delete Result
async function deleteResult(resultId) {
    if (!confirm("Are you sure you want to delete this result?")) return;

    try {
        let response = await fetch(`${API_URL}/results/${resultId}`, { method: "DELETE" });
        let data = await response.json();

        if (response.ok) {
            alert("🗑 Result deleted successfully!");
            displayResults(); // ✅ Refresh results list
        } else {
            throw new Error(data.message || "Delete failed.");
        }
    } catch (error) {
        console.error("❌ Error deleting result:", error);
        alert("❌ Failed to delete result.");
    }
}
window.deleteResult = deleteResult;

// ✅ Ensure Everything Runs on Page Load
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 DOM Loaded - Initializing Results");
    populateYearDropdowns();
    displayResults();
});

// ----------------------------------------
// ✅ VIDEO MANAGEMENT (SQL via API)
// ----------------------------------------

// ✅ Ensure Functions Run on Page Load
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 DOM Loaded - Initializing Videos");
    displayVideos();  // ✅ Load videos on page load
});

// ✅ Upload Video to firebase storage
async function addVideo() {
    let videoTitle = document.getElementById("videoTitle").value.trim();
    let videoFile = document.getElementById("videoFile").files[0];

    if (!videoFile || !videoTitle) {
        alert("⚠️ Please enter a title and select a video file.");
        return;
    }

    // ✅ Upload video to Firebase Storage
    const storagePath = `videos/${Date.now()}_${videoFile.name}`;
    const videoUrl = await uploadFile(videoFile, storagePath);

    // ✅ Now save title and videoUrl to your backend
    let formData = new FormData();
    formData.append("title", videoTitle);
    formData.append("video_url", videoUrl);

    try {
        let response = await fetch(`${API_URL}/upload-video`, {
            method: "POST",
            body: formData,
        });

        let data = await response.json();
        if (response.ok) {
            alert("✅ Video uploaded successfully!");
            displayVideos();
        } else {
            throw new Error(data.message || "Upload failed.");
        }
    } catch (error) {
        console.error("❌ Error uploading video:", error);
        alert("❌ Failed to upload video.");
    }
}
window.addVideo = addVideo; // ✅ Ensure function is globally accessible

// ✅ Fetch Videos from MySQL
async function displayVideos() {
    let videoContainer = document.getElementById("videoGallery") || document.getElementById("adminVideoDisplay");
    if (!videoContainer) {
        console.error("❌ Video container not found.");
        return;
    }

    videoContainer.innerHTML = "<p>Loading videos...</p>";

    try {
        let response = await fetch(`${API_URL}/videos`);
        if (!response.ok) throw new Error("Failed to fetch videos.");
        
        let videos = await response.json();
        console.log("✅ Videos received:", videos);

        if (videos.length === 0) {
            videoContainer.innerHTML = "<p>No videos available.</p>";
            return;
        }

        videoContainer.innerHTML = "";
        let isAdmin = document.getElementById("adminVideoDisplay") !== null; // ✅ Check if on admin page

        videos.forEach((video) => {
            console.log(`🎥 Processing video: ${video.title}, URL: ${video.video_url}`);

            videoContainer.innerHTML += `
                <h3>${video.title}</h3>
                <video width="320" height="240" controls>
                    <source src="${video.video_url}" type="video/mp4">
                </video>
                ${isAdmin ? `<button onclick="deleteVideo(${video.id})">Delete</button>` : ""}
                <hr>
            `;
        });

        console.log("✅ Videos displayed successfully.");
    } catch (error) {
        console.error("❌ Error fetching videos:", error);
        videoContainer.innerHTML = "<p>Error loading videos.</p>";
    }
}
window.displayVideos = displayVideos;

// ✅ Delete Video from MySQL
async function deleteVideo(videoId) {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
        let response = await fetch(`${API_URL}/videos/${videoId}`, { method: "DELETE" });
        let data = await response.json();

        if (response.ok) {
            alert("🗑 Video deleted successfully!");
            displayVideos(); // ✅ Refresh video list
        } else {
            throw new Error(data.message || "Delete failed.");
        }
    } catch (error) {
        console.error("❌ Error deleting video:", error);
        alert("❌ Failed to delete video.");
    }
}
window.deleteVideo = deleteVideo;

document.addEventListener("DOMContentLoaded", function () {
    checkLogin(); // Ensures login status is checked on load
    populateYearDropdowns(); // Populates the dropdown for results
    displayResults(); // Loads results dynamically
    fetchNews(); // Loads news dynamically
    displayVideos(); // Loads videos dynamically
  });
  
  window.saveResults = saveResults;
window.saveNews = saveNews;
window.addVideo = addVideo;
window.deleteResult = deleteResult;
window.deleteNews = deleteNews;
window.deleteVideo = deleteVideo;
