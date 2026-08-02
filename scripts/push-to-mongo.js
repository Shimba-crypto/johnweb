// Push local data/ JSON files into MongoDB.
// Usage: node scripts/push-to-mongo.js
// Reads MONGODB_URI + MONGODB_DB from env (or .env.local).
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";

function loadEnv() {
  const env = {};
  const fp = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(fp)) {
    for (const line of fs.readFileSync(fp, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^"|"$/g, "");
    }
  }
  return env;
}

const env = loadEnv();
const URI = process.env.MONGODB_URI || env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || env.MONGODB_DB || "johnweb";

if (!URI) { console.error("MONGODB_URI not set"); process.exit(1); }

const DATA_DIR = path.join(process.cwd(), "data");

// Authoritative seeded super admins (from scripts/seed.js)
const DEFAULT_ADMINS = [
  {
    id: "admin-trjohnx",
    name: "Tr-John-X",
    email: "shimbacc@hotmail.com",
    password: "$2a$10$7UJW0rO.tUvLiKZXgWI2p.iXnUNWwWdVGvz4.CYx/.2mjsOkukLxW",
    role: "super_admin",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "superadmin-silungwe",
    name: "Silungwe John",
    email: "silungwejohn24@gmail.com",
    password: "$2a$10$lz5Eq7bJxnBS3sBQvsqINOcVZ2dHJYDMVhvxqaB2cMtXv8vqy3Dce",
    role: "super_admin",
    createdAt: "2026-08-02T12:35:00.000Z",
  },
];

async function main() {
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 40000 });
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Connected to ${DB_NAME}`);

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const CORE = ["subjects", "papers", "questions", "users"];
  for (const f of files) {
    const coll = f.replace(".json", "");
    let docs;
    if (CORE.includes(coll)) {
      docs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));
      if (f === "users.json") docs = DEFAULT_ADMINS;
      if (!Array.isArray(docs)) docs = [];
    } else {
      docs = [];
    }
    await db.collection(coll).deleteMany({});
    if (docs.length) await db.collection(coll).insertMany(docs.map(({ _id, ...rest }) => rest));
    console.log(`  ${coll}: ${docs.length} docs`);
  }
  await client.close();
  console.log("Done. Data is now in MongoDB.");
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
