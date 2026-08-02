import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_NAME = process.env.MONGODB_DB || "johnweb";

let client = null;
let db = null;
let usingMongo = false;
const cache = {};

function getMongoUrl() {
  return process.env.MONGODB_URI || process.env.DATABASE_URL || "";
}

function readFile(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

function writeFile(filename, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

async function connectMongo() {
  const MONGO_URL = getMongoUrl();
  if (!MONGO_URL || usingMongo) return usingMongo;
  try {
    client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 6000 });
    await client.connect();
    db = client.db(DB_NAME);
    usingMongo = true;
    console.log("✅ Connected to MongoDB Atlas");
    return true;
  } catch (e) {
    console.error("❌ MongoDB connection failed, using JSON files:", e.message);
    usingMongo = false;
    return false;
  }
}

async function loadAll() {
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const name = c.name + ".json";
    const docs = await db.collection(c.name).find({}).toArray();
    cache[name] = docs.map(({ _id, ...rest }) => rest);
  }
}

export function readJSON(filename) {
  if (cache[filename] !== undefined) return cache[filename];
  return readFile(filename);
}

export function writeJSON(filename, data) {
  cache[filename] = data;
  if (usingMongo) {
    db.collection(filename.replace(".json", ""))
      .deleteMany({})
      .then(() => (data.length > 0 ? db.collection(filename.replace(".json", "")).insertMany(data) : Promise.resolve()))
      .catch((e) => console.error("Mongo write error:", e.message));
  }
  writeFile(filename, data);
}

export async function initStorage() {
  if (getMongoUrl()) {
    const ok = await connectMongo();
    if (ok) await loadAll();
  }
  // Preload existing JSON files into cache for consistency
  if (fs.existsSync(DATA_DIR)) {
    fs.readdirSync(DATA_DIR).forEach((f) => {
      if (f.endsWith(".json") && cache[f] === undefined) cache[f] = readFile(f);
    });
  }
  console.log(`Storage ready: ${usingMongo ? "MongoDB Atlas" : "JSON files"} (${Object.keys(cache).length} tables)`);
}
