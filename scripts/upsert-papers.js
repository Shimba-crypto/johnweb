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

  // Subjects — bulk upsert
  const subjects = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "subjects.json"), "utf8"));
  const existingSubIds = new Set((await db.collection("subjects").find({}, { projection: { id: 1 } }).toArray()).map((s) => s.id));
  const newSubs = subjects.filter((s) => !existingSubIds.has(s.id));
  if (newSubs.length) {
    await db.collection("subjects").bulkWrite(newSubs.map((s) => ({
      updateOne: { filter: { id: s.id }, update: { $set: { ...s, _id: s.id } }, upsert: true },
    })));
  }
  console.log(`  subjects: ${newSubs.length} new (${subjects.length} total in files)`);

  // Papers — bulk upsert
  const papers = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "papers.json"), "utf8"));
  const existingPapIds = new Set((await db.collection("papers").find({}, { projection: { id: 1 } }).toArray()).map((p) => p.id));
  const newPaps = papers.filter((p) => !existingPapIds.has(p.id));
  if (newPaps.length) {
    await db.collection("papers").bulkWrite(newPaps.map((p) => ({
      updateOne: { filter: { id: p.id }, update: { $set: { ...p, _id: p.id } }, upsert: true },
    })));
  }
  console.log(`  papers: ${newPaps.length} new (${papers.length} total in files)`);

  // Questions — bulk upsert (faster)
  const questions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "questions.json"), "utf8"));
  const existingQIds = new Set((await db.collection("questions").find({}, { projection: { id: 1 } }).toArray()).map((q) => q.id));
  const newQs = questions.filter((q) => !existingQIds.has(q.id));
  if (newQs.length) {
    await db.collection("questions").bulkWrite(newQs.map((q) => ({
      updateOne: { filter: { id: q.id }, update: { $set: { ...q, _id: q.id } }, upsert: true },
    })));
  }
  console.log(`  questions: ${newQs.length} new (${questions.length} total in files)`);

  await client.close();
  console.log("Upsert complete.");
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
