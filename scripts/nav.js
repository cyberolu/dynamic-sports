// scripts/nav.js
// Works on BOTH Localhost (Live Server) and Netlify Clean URLs

import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  const role = localStorage.getItem("role");

  // Detect environment
  const isLocalhost =
    location.hostname === "127.0.0.1" || location.hostname === "localhost";
  // Detect project root (IMPORTANT FIX)
  const projectRoot = isLocalhost ? "/Dynamicsports/" : "/";

  // Compute folder depth safely
  let path = window.location.pathname;

  if (path === "/" || path === "/index.html") {
    path = "/";
  }

  let segments = path.split("/").filter(Boolean);

  // FIXED DEPTH LOGIC
  let depth = segments.length;

  if (path === "/") depth = 0;

  if (segments.length === 1 && segments[0].toLowerCase() === "index.html") {
    depth = 0;
  }

  if (segments.length > 1 && segments[segments.length - 1].includes(".html")) {
    depth = segments.length - 1;
  }

  const basePath = depth === 0 ? "" : "../".repeat(depth);

  // Helper for localhost vs Netlify
  const makeLink = (folder) => {
    return isLocalhost
      ? `${projectRoot}${folder}/index.html`
      : `${basePath}${folder}/`;
  };

  // MAIN NAV
  let menu = `
    <a href="${isLocalhost ? projectRoot : basePath}">Home</a>
    <a href="${makeLink('about')}">About</a>
    <a href="${makeLink('news')}">News</a>
    <a href="${makeLink('competitions')}">Competitions</a>
    <a href="${makeLink('results')}">Results</a>
    <a href="${makeLink('members')}">Members</a>
    <a href="${makeLink('contact')}">Contact</a>
  `;

  // ADMIN EXTRAS
  if (role === "admin") {
    menu += `
      <a href="${makeLink('admin')}" style="font-weight:bold;">Admin</a>
      <a href="#" id="logoutLink" style="color:#b00;">Logout</a>
    `;
  }
  // MEMBER EXTRAS
  else if (role === "member") {
    menu += `<a href="#" id="logoutLink" style="color:#b00;">Logout</a>`;
  }
  // GUEST
  else {
    menu += `<a href="${makeLink('login')}">Login</a>`;
  }

  nav.innerHTML = menu;

  // LOGOUT HANDLER
  document.addEventListener("click", async (e) => {
    if (e.target.id === "logoutLink") {
      e.preventDefault();
      try {
        await signOut(getAuth());
      } catch (_) {}
      localStorage.removeItem("role");
      window.location.href = `${makeLink("login")}`;
    }
  });
});
