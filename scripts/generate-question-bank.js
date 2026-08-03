// Generate a question bank (10 MCQs per subject × grade 6/7) using the AI provider.
// Usage: node scripts/generate-question-bank.js
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const settings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "settings.json"), "utf-8"));
const openrouterKey = settings.openrouterApiKey || process.env.OPENROUTER_API_KEY;
const deepseekKey = settings.deepseekApiKey || process.env.DEEPSEEK_API_KEY;

const SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Geography",
  "History", "Civic Education", "Religious Education", "Computer Studies", "Commerce",
  "Additional Mathematics", "Science", "Social Studies", "Principles of Accounts",
  "Agricultural Science", "English Literature", "Integrated Science", "Creative and Technology Studies",
];
const GRADES = ["6", "7"];
const PER_GRADE = 12;

async function askAI(prompt) {
  if (deepseekKey) {
    try {
      const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
        body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], max_tokens: 2500 }),
      });
      if (r.ok) { const d = await r.json(); return d.choices?.[0]?.message?.content || ""; }
    } catch {}
  }
  if (openrouterKey) {
    const models = ["openrouter/free", "google/gemma-4-31b-it:free", "inclusionai/ling-3.0-flash:free"];
    for (const model of models) {
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${openrouterKey}`, "HTTP-Referer": "https://johnweb.com" },
          body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 2500 }),
        });
        if (r.ok) { const d = await r.json(); const t = d.choices?.[0]?.message?.content || ""; if (t) return t; }
      } catch {}
    }
  }
  return "";
}

function parseJSON(text) {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try { return JSON.parse(m[0]); } catch {}
  // try to fix common issues
  try { return JSON.parse(m[0].replace(/,\s*([\]}])/g, "$1")); } catch {}
  return [];
}

const bank = {};
for (const subject of SUBJECTS) {
  bank[subject] = bank[subject] || {};
  for (const grade of GRADES) {
    const prompt = `Create a JSON array (ONLY the array, no other text) of ${PER_GRADE} multiple-choice questions for a Zambian ECZ Grade ${grade} ${subject} exam. Age-appropriate for Grade ${grade} (primary school). Each object: {"text":"question","options":["a","b","c","d"],"answer":"correct option text (must exactly match one option)","marks":2}. Ensure options are plausible and the answer matches one option exactly.`;
    process.stdout.write(`Generating ${subject} grade ${grade}... `);
    const raw = await askAI(prompt);
    const qs = parseJSON(raw);
    if (qs.length >= 5) {
      bank[subject][grade] = qs.map((q) => ({ text: q.text, options: q.options, answer: q.answer, marks: q.marks || 2 }));
      console.log(`OK (${qs.length})`);
    } else {
      console.log(`FAILED (${qs.length})`);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

fs.writeFileSync(path.join(DATA_DIR, "question-bank.json"), JSON.stringify(bank, null, 2));
console.log("\nSaved question-bank.json");
