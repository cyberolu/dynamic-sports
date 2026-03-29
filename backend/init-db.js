require("dotenv").config();
const { Pool } = require("pg");

const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const queries = `
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  year VARCHAR(10),
  file_name TEXT,
  file_url TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  title TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.query(queries)
  .then(() => {
    console.log("✅ Tables created successfully");
    db.end();
  })
  .catch((err) => {
    console.error("❌ Error creating tables:", err);
    db.end();
  });
