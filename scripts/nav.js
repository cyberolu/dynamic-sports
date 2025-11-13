// scripts/nav.js
// Dynamically builds navigation menu based on login role (admin/member/guest)

import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const role = localStorage.getItem("role");

  // Detect if we’re inside /admin/ folder
  const inAdminFolder = window.location.pathname.includes("/admin/");
  const basePath = inAdminFolder ? "../" : "";

  // Default base menu
  let menu = `
    <a href="${basePath}index.html">Home</a>
    <a href="${basePath}news.html">News</a>
    <a href="${basePath}competitions.html">Competitions</a>
    <a href="${basePath}members.html">Members</a>
  `;

  // Add role-based links
  if (role === "admin") {
    menu += `
      <a href="${basePath}admin/index.html" style="font-weight:bold;">Admin</a>
      <a href="#" id="logoutLink" style="color:#b00;">Logout</a>
    `;
  } else if (role === "member") {
    menu += `<a href="#" id="logoutLink" style="color:#b00;">Logout</a>`;
  } else {
    menu += `<a href="${basePath}login.html">Login</a>`;
  }

  nav.innerHTML = menu;

  // ✅ Consistent logout (works from anywhere)
  document.addEventListener("click", async (e) => {
    if (e.target.id === "logoutLink") {
      e.preventDefault();
      try {
        const auth = getAuth(); // get existing Firebase instance
        await signOut(auth); // log user out of Firebase
      } catch (err) {
        console.warn("Firebase sign-out skipped:", err.message);
      }
      localStorage.removeItem("role");
      window.location.href = `${basePath}login.html`;
    }
  });
});
