import fs from "fs";
import path from "path";
import app, { migrateData, persistCriticalToMongo, checkSubscriptions } from "./app.js";
import { initStorage } from "./storage.js";

// Load .env.local if present
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const PORT = process.env.PORT || 3001;

initStorage().then(async () => {
  migrateData();
  await persistCriticalToMongo();
  checkSubscriptions(); // notify about expiring subscriptions at startup
  setInterval(checkSubscriptions, 6 * 60 * 60 * 1000); // and every 6 hours
  app.listen(PORT, () => console.log(`JohnWeb server running on port ${PORT}`));
});
