// ✅ Load Environment Variables
require("dotenv").config();

// ✅ Core Modules
const fs = require("fs");
const os = require("os");
const path = require("path");

// ✅ External Modules
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Dynamically Get Server IP
const getServerIP = () => {
  const interfaces = os.networkInterfaces();
  for (let key in interfaces) {
    for (let iface of interfaces[key]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
};
const SERVER_IP = getServerIP();
console.log(`🌍 Server IP: ${SERVER_IP}`);

// ✅ Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ PostgreSQL Connection
const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

db.connect()
  .then(() => console.log("✅ PostgreSQL Connected!"))
  .catch((err) => {
    console.error("❌ PostgreSQL Connection Failed:", err);
    process.exit(1);
  });

// ✅ Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ API Grouping
const api = express.Router();

// Results
api.post("/upload", upload.single("file"), (req, res) => {
  const { year } = req.body;
  const fileName = req.file.filename;
  const fileUrl = `/uploads/${fileName}`;

  db.query(
    "INSERT INTO results (year, file_name, file_url) VALUES ($1, $2, $3)",
    [year, fileName, fileUrl],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send({ message: "✅ File uploaded successfully!", fileUrl });
    }
  );
});

api.get("/results", (req, res) => {
  db.query("SELECT * FROM results ORDER BY uploaded_at DESC", (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results.rows);
  });
});

api.delete("/results/:id", (req, res) => {
  db.query("DELETE FROM results WHERE id = $1", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "🗑 Result deleted successfully!" });
  });
});

// ✅ News
api.post("/upload-news", async (req, res) => {
  try {
    const { title, content, image_url } = req.body;
    await db.query(
      "INSERT INTO news (title, content, image_url) VALUES ($1, $2, $3)",
      [title, content, image_url]
    );
    res.send({ message: "✅ News uploaded successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

api.get("/news", (req, res) => {
  db.query("SELECT * FROM news ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results.rows);
  });
});

api.delete("/news/:id", (req, res) => {
  db.query("DELETE FROM news WHERE id = $1", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "🗑 News deleted successfully!" });
  });
});

// ✅ Videos
api.post("/upload-video", async (req, res) => {
  try {
    const { title, video_url } = req.body;
    await db.query(
      "INSERT INTO videos (title, video_url) VALUES ($1, $2)",
      [title, video_url]
    );
    res.send({ message: "✅ Video uploaded successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

api.get("/videos", (req, res) => {
  db.query("SELECT * FROM videos ORDER BY created_at DESC", (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results.rows);
  });
});

api.delete("/videos/:id", (req, res) => {
  db.query("DELETE FROM videos WHERE id = $1", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "🗑 Video deleted successfully!" });
  });
});

// ✅ Register API Routes
app.use("/api", api);

// ✅ Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 App running on http://0.0.0.0:${PORT}`);
});
