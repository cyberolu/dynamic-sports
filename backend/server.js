import express from "express";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/* ================================
   PATH SETUP
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================================
   APP SETUP
================================ */
const app = express();
const PORT = process.env.PORT || 8080;

/* ================================
   FIREBASE SETUP
================================ */
const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/* ================================
   TEST ROUTE
================================ */
app.get("/", (req, res) => {
  res.send("✅ Backend running");
});

/* ================================
   🔥 NEWS ROUTE (SLUG BASED)
================================ */
app.get("/news/:slug", async (req, res) => {
  const slug = req.params.slug;

  try {
    // ✅ FIND BY SLUG (NEW)
    const snapshot = await db
      .collection("news")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).send("Article not found");
    }

    const doc = snapshot.docs[0];
    const article = doc.data();

    const title = article.title || "Dynamic Athletics";
    const description = article.desc || "Latest news";
    const image =
      article.image ||
      "https://www.dynamic-athletics.com/assets/logo.png";

    const url = `https://backend-winter-pond-2073.fly.dev/news/${slug}`;

    res.set("Content-Type", "text/html");

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="article">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">

</head>
<body>

<script>
  window.location.href = "https://www.dynamic-athletics.com/news.html?slug=${slug}";
</script>

<noscript>
  <p>Open article:</p>
  <a href="https://www.dynamic-athletics.com/news.html?slug=${slug}">
    Click here
  </a>
</noscript>

</body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

/* ================================
   START SERVER (CRITICAL FOR FLY)
================================ */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});