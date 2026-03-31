import express from "express";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* =====================================================
   PATH SETUP (ES MODULE SAFE)
===================================================== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =====================================================
   APP SETUP
===================================================== */
const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   FIREBASE ADMIN SETUP
===================================================== */
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* =====================================================
   HELPERS
===================================================== */
function escapeHtml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =====================================================
   ARTICLE ROUTE (SERVER-SIDE OG TAGS)
===================================================== */
app.get("/news/story", async (req, res) => {
  const slug = (req.query.slug || "").trim();
  if (!slug) return res.status(404).send("Not found");

  try {
    const snap = await db
      .collection("news")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(404).send("Article not found");
    }

    const article = snap.docs[0].data();

    /* ---------- SAFE FALLBACKS ---------- */
    const ogTitle =
      article.title || "Dynamic Athletics News";

    const ogDescription =
      article.summary ||
      article.desc ||
      "Latest news from Dynamic Athletics.";

    const ogImage =
      article.featuredImage ||
      article.imageURL ||
      "https://www.dynamic-athletics.com/assets/Untitled-design-1.svg";

    const canonicalUrl =
      `https://www.dynamic-athletics.com/news/story?slug=${encodeURIComponent(slug)}`;

    res.set("Content-Type", "text/html");

    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(ogTitle)}</title>

  <!-- CSS -->
  <link rel="stylesheet" href="/style.css">
  <link rel="icon" href="/assets/Untitled-design-1.svg">

  <!-- Open Graph / SEO -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Dynamic Athletics">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <link rel="canonical" href="${canonicalUrl}">
</head>
<body>

  <!-- Article content injected by story.js -->
  <div id="app"></div>

  <!-- Share button -->
  <div class="wrap" style="margin-top:1rem;">
    <button id="shareBtn" class="btn secondary">
      Share this article
    </button>
  </div>

  <!-- Client-side renderer -->
  <script type="module" src="/scripts/story.js"></script>

</body>
</html>`);
  } catch (err) {
    console.error("Story render error:", err);
    res.status(500).send("Server error");
  }
});

/* =====================================================
   STATIC FILES (ENTIRE SITE)
===================================================== */
app.use(express.static(path.join(__dirname, "..")));

/* =====================================================
   START SERVER
===================================================== */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
