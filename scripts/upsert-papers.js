#!/usr/bin/env node
// Upsert local papers/subjects/questions into MongoDB (Render live DB).
// Adds only what's missing — never deletes. Runs on deploy.
// Usage: node scripts/upsert-papers.js
import fs from "fs";
import path from "path";
import { MongoClient } from "mongodb";

function loadEnv() {
  const env = {};
  const fp = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(fp)) {
    for (const line of fs.readFileSync(fp, "utf8").split("\n")) {
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
const DATA_DIR = path.join(process.cwd(), "data");

async function main() {
  if (!URI) { console.error("MONGODB_URI not set — skipping upsert"); process.exit(0); }
  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 40000 });
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Connected to ${DB_NAME}`);

  // Subjects
  const subjects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "subjects.json"), "utf8"));
  let subAdded = 0;
  for (const s of subjects) {
    const exists = await db.collection("subjects").findOne({ id: s.id });
    if (!exists) {
      await db.collection("subjects").insertOne({ ...s, _id: s.id });
      subAdded++;
    }
  }
  console.log(`  subjects: ${subAdded} new (${subjects.length} total in files)`);

  // Papers
  const papers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "papers.json"), "utf8"));
  let papAdded = 0;
  for (const p of papers) {
    const exists = await db.collection("papers").findOne({ id: p.id });
    if (!exists) {
      await db.collection("papers").insertOne({ ...p, _id: p.id });
      papAdded++;
    }
  }
  console.log(`  papers: ${papAdded} new (${papers.length} total in files)`);

  // Questions (only for new papers to avoid re-inserting 1440)
  const questions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "questions.json"), "utf8"));
  let qAdded = 0;
  for (const q of questions) {
    const exists = await db.collection("questions").findOne({ id: q.id });
    if (!exists) {
      await db.collection("questions").insertOne({ ...q, _id: q.id });
      qAdded++;
    }
  }
  console.log(`  questions: ${qAdded} new (${questions.length} total in files)`);

  await client.close();
  console.log("Upsert complete.");
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
