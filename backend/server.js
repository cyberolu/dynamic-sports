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
   NEWS LIST ROUTE
================================ */
app.get("/news", (req, res) => {
  res.redirect("https://www.dynamic-athletics.com/news.html");
});

/* ================================
   🔥 NEWS ARTICLE ROUTE (FINAL)
================================ */
app.get("/news/:slug", async (req, res) => {
  const slug = req.params.slug;

  try {
    const snapshot = await db
      .collection("news")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).send("Article not found");
    }

    const article = snapshot.docs[0].data();

    const title = article.title || "Dynamic Athletics";
    const description = article.desc || "Latest news";
    const image =
      article.featuredImage ||
      article.image ||
      article.imageURL ||
      "https://www.dynamic-athletics.com/assets/logo.png";

    const url = `https://www.dynamic-athletics.com/news/${slug}`;

    const userAgent = (req.headers["user-agent"] || "").toLowerCase();

    const isBot =
      userAgent.includes("facebookexternalhit") ||
      userAgent.includes("facebot") ||
      userAgent.includes("twitterbot") ||
      userAgent.includes("whatsapp") ||
      userAgent.includes("linkedinbot") ||
      userAgent.includes("slackbot") ||
      userAgent.includes("discordbot");

    // 🤖 BOT → return OG tags ONLY
    if (isBot) {
      return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>

  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">
  <meta property="og:url" content="${url}">
  <meta property="og:type" content="article">

  <meta name="twitter:card" content="summary_large_image">
</head>
<body></body>
</html>`);
    }

    // 👤 USER → proper redirect (NO JS)
    return res.redirect(
      `https://www.dynamic-athletics.com/news_item/?slug=${slug}`
    );

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

/* ================================
   START SERVER
================================ */
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server running on port " + PORT);
});