import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY))
  });
}

const db = admin.firestore();

export async function handler(event) {
  const id = event.queryStringParameters.id;

  if (!id) {
    return {
      statusCode: 404,
      body: "Missing ID"
    };
  }

  const doc = await db.collection("news").doc(id).get();

  if (!doc.exists) {
    return {
      statusCode: 404,
      body: "Not found"
    };
  }

  const data = doc.data();

  const html = `
  <!doctype html>
  <html>
    <head>
      <title>${data.title}</title>

      <meta property="og:title" content="${data.title}">
      <meta property="og:description" content="${(data.desc || "").substring(0,150)}">
      <meta property="og:image" content="${data.imageURL}">
      <meta property="og:type" content="article">

      <meta http-equiv="refresh" content="0; url=/news_item/index.html?id=${id}">
    </head>
    <body></body>
  </html>
  `;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html" },
    body: html
  };
}