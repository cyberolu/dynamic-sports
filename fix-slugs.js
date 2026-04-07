import admin from "firebase-admin";
import fs from "fs";

// 🔐 load service account
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 🔥 slug generator
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove special chars
    .replace(/\s+/g, "-");      // spaces → dash
}

async function fixSlugs() {
  const snapshot = await db.collection("news").get();

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // skip if slug already exists
    if (data.slug) continue;

    if (!data.title) {
      console.log(`⚠️ Skipping (no title): ${doc.id}`);
      continue;
    }

    const slug = generateSlug(data.title);

    await doc.ref.update({ slug });

    console.log(`✅ Updated: ${doc.id} → ${slug}`);
  }

  console.log("🎉 Done fixing slugs");
}

fixSlugs();