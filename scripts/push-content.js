#!/usr/bin/env node
// Push freshly-seeded subjects/papers/questions to the live Mongo DB.
// Only touches the 3 content tables - preserves users, answers, xp, etc.
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

function loadEnv() {
  const p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const MONGO_URL = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!MONGO_URL) {
  console.error("No MONGODB_URI found");
  process.exit(1);
}
const DB = process.env.MONGODB_DB || "johnweb";
const TABLES = ["subjects", "papers", "questions"];

async function main() {
  const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db = client.db(DB);
  console.log("Connected to", DB);

  for (const t of TABLES) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, t + ".json"), "utf-8"));
    const coll = db.collection(t);
    const before = await coll.countDocuments();
    await coll.deleteMany({});
    if (Array.isArray(data) && data.length) {
      const docs = data.map(({ _id, ...rest }) => rest);
      await coll.insertMany(docs);
    }
    const after = await coll.countDocuments();
    console.log(`${t}: ${before} -> ${after} docs`);
  }

  await client.close();
  console.log("Done. Content tables updated on live DB.");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
