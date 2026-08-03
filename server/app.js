import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readJSON, writeJSON, initStorage } from "./storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

// ─── JWT SECRET ─────────────────────────────────────────────
// Prefer env; otherwise persist a strong random secret in settings.json so
// tokens survive restarts. Never falls back to a hardcoded value.
import crypto from "crypto";
function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const current = readJSON("settings.json");
  const settings = (current && typeof current === "object" && !Array.isArray(current)) ? current : {};
  if (settings.jwtSecret) return settings.jwtSecret;
  const secret = crypto.randomBytes(48).toString("hex");
  settings.jwtSecret = secret;
  writeJSON("settings.json", settings);
  console.log("Generated a new random JWT secret (stored in settings.json)");
  return secret;
}
const JWT_SECRET = getJwtSecret();

const app = express();
app.set("trust proxy", 1);

// ─── CORS (restricted) ──────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "https://johnweb-qncu.onrender.com,http://localhost:5173,http://localhost:3001").split(",").map((s) => s.trim());
const corsOptions = {
  origin(origin, cb) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
};
app.use(cors(corsOptions));
app.use(express.json());

// ─── SECURITY HEADERS ───────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://api.deepseek.com https://openrouter.ai; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'"
  );
  next();
});

const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^\/(?!api|uploads|backups).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

// ─── AI Helper (free models) ───────────────────────────────
const FREE_MODELS = [
  "openrouter/free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "inclusionai/ling-3.0-flash:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "openai/gpt-oss-20b:free",
  "poolside/laguna-s-2.1:free",
  "poolside/laguna-xs-2.1:free",
];

async function askFreeAI(messages, maxTokens = 300) {
  const settings = readJSON("settings.json");
  const deepseekKey = settings.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  const openrouterKey = settings.openrouterApiKey || process.env.OPENROUTER_API_KEY;

  if (deepseekKey) {
    try {
      const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
        body: JSON.stringify({ model: "deepseek-chat", messages, max_tokens: maxTokens }),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content?.trim();
        if (text) return { text, provider: "deepseek" };
      }
    } catch {}
  }

  if (openrouterKey) {
    // Free models are flaky (random refusals/truncation) — retry the whole list a few times.
    for (let round = 0; round < 3; round++) {
      for (const model of FREE_MODELS) {
        try {
          const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${openrouterKey}`, "HTTP-Referer": "https://johnweb.com" },
            body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
          });
          if (r.ok) {
            const d = await r.json();
            const msg = d.choices?.[0]?.message;
            const text = msg?.content?.trim();
            if (text) return { text, provider: model };
          }
        } catch {}
      }
    }
  }
  return { text: null, error: "No AI provider available" };
}

// ─── SECURITY: Sanitization & Rate Limiting ───────────────
function sanitize(input, maxLen = 5000) {
  if (typeof input !== "string") return input;
  let s = input.slice(0, maxLen);
  // Strip dangerous control chars but PRESERVE tab/newline/carriage-return
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  // Neutralize dangerous HTML elements (frontend escapes output too)
  s = s.replace(/<\s*\/?\s*(script|iframe|object|embed|link|meta|style|base)\b/gi, "&lt;$1");
  // Strip event-handler attributes (onclick, onerror, ...)
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, " ");
  // Block dangerous URL schemes (covers markdown links and href/src)
  s = s.replace(/(javascript|vbscript)\s*:/gi, "$1&colon;");
  s = s.replace(/data\s*:/gi, "data&colon;");
  return s;
}

function sanitizeBody(req, res, next) {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === "string") req.body[key] = sanitize(req.body[key]);
    }
  }
  next();
}

// Password strength policy
function validatePassword(pw) {
  if (typeof pw !== "string" || pw.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(pw)) return "Password must contain at least one letter";
  if (!/\d/.test(pw)) return "Password must contain at least one number";
  return null;
}

const rateLimitStore = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    // req.ip is derived from the trusted proxy (Render), so a client-spoofed
    // X-Forwarded-For header cannot bypass the limit.
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const record = rateLimitStore.get(key);
    if (!record || now - record.start > windowMs) {
      rateLimitStore.set(key, { start: now, count: 1 });
      return next();
    }
    record.count++;
    if (record.count > max) return res.status(429).json({ error: "Too many requests. Please slow down." });
    next();
  };
}

app.use("/api/auth", rateLimit(20, 60000));
app.use("/api/comments", rateLimit(30, 60000));
app.use("/api/answers", rateLimit(20, 60000));
app.use("/api/chat", rateLimit(30, 60000));
app.use("/api/ratings", rateLimit(30, 60000));
app.use(sanitizeBody);

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });
  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  const users = readJSON("users.json");
  // Generic response to avoid user enumeration
  if (users.find((u) => u.email === email)) return res.status(400).json({ error: "Unable to create account. Please check your details and try again." });
  const role = users.length === 0 ? "super_admin" : "student";
  const user = { id: uuidv4(), name, email, password: bcrypt.hashSync(password, 10), role, createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON("users.json", users);
  res.json({ message: "User created", user: { id: user.id, name: user.name, email: user.email } });
});

const loginAttempts = new Map();

app.post("/api/auth/login", (req, res) => {
  const emailKey = String(req.body?.email || "").toLowerCase();
  if (emailKey) {
    const now = Date.now();
    const rec = loginAttempts.get(emailKey);
    if (rec && now - rec.start < 15 * 60 * 1000) {
      if (rec.count >= 10) return res.status(429).json({ error: "Too many login attempts. Please try again later." });
      rec.count++;
    } else {
      loginAttempts.set(emailKey, { start: now, count: 1 });
    }
  }
  const { email, password } = req.body;
  const users = readJSON("users.json");
  const user = users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get("/api/auth/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const users = readJSON("users.json");
    const user = users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

app.get("/api/subjects", (req, res) => {
  const subjects = readJSON("subjects.json");
  const papers = readJSON("papers.json");
  res.json(subjects.map((s) => ({ ...s, papers: papers.filter((p) => p.subjectId === s.id) })));
});

app.get("/api/papers", (req, res) => {
  let papers = readJSON("papers.json");
  const { subjectId, grade, year } = req.query;
  if (subjectId) papers = papers.filter((p) => p.subjectId === subjectId);
  if (grade) papers = papers.filter((p) => p.grade === grade);
  if (year) papers = papers.filter((p) => p.year === parseInt(year));
  res.json(papers);
});

app.get("/api/papers/:id", (req, res) => {
  const papers = readJSON("papers.json");
  const paper = papers.find((p) => p.id === req.params.id);
  if (!paper) return res.status(404).json({ error: "Not found" });
  const questions = readJSON("questions.json").filter((q) => q.paperId === paper.id);
  res.json({ ...paper, questions });
});

app.get("/api/questions", (req, res) => {
  const { paperId } = req.query;
  if (!paperId) return res.status(400).json({ error: "paperId required" });
  res.json(readJSON("questions.json").filter((q) => q.paperId === paperId));
});

app.get("/api/answers/mine", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const answers = readJSON("answers.json").filter((a) => a.userId === userId);
    const questions = readJSON("questions.json");
    const papers = readJSON("papers.json");
    const enriched = answers.map((a) => {
      const q = questions.find((x) => x.id === a.questionId);
      const p = papers.find((x) => x.id === q?.paperId);
      return { ...a, question: q || null, paper: p || null };
    });
    res.json(enriched);
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

const ROLE_HIERARCHY = ["student", "investor", "teacher", "dev", "admin", "super_admin"];

// ─── ADMIN SECRET ──────────────────────────────────────────
// All /api/admin/* and /api/users routes additionally require this secret.
// Only the owner's private CLI/GUI (which hold the secret) can manage the app.
// Configure via ADMIN_SECRET env (durable on Render) or settings.adminSecret.
function getAdminSecret() {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET;
  const settings = readJSON("settings.json");
  if (settings && typeof settings === "object" && settings.adminSecret) return settings.adminSecret;
  return "";
}

function adminSecret(req, res, next) {
  const secret = getAdminSecret();
  if (!secret) return res.status(403).json({ error: "Admin management is disabled. Configure ADMIN_SECRET." });
  const provided = req.headers["x-admin-secret"];
  if (!provided || provided !== secret) return res.status(403).json({ error: "Admin secret required or incorrect" });
  next();
}

app.use("/api/admin", adminSecret);
app.use("/api/users", adminSecret);

// Public profile (must be registered BEFORE /api/users admin-secret middleware)
app.get("/api/users/:id/public", (req, res) => {
  const users = readJSON("users.json");
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const answers = readJSON("answers.json").filter((a) => a.userId === user.id);
  const ratings = readJSON("ratings.json").filter((r) => r.targetId === user.id);
  const xp = readJSON("xp.json").find((x) => x.userId === user.id);
  const correct = answers.filter((a) => a.isCorrect).length;
  res.json({
    id: user.id, name: user.name, role: user.role,
    createdAt: user.createdAt, totalAnswers: answers.length, correct,
    percentage: answers.length ? Math.round((correct / answers.length) * 100) : 0,
    avgRating: ratings.length ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 10) / 10 : 0,
    ratingCount: ratings.length, level: xp ? Math.floor(Math.sqrt(xp.xp / 100)) + 1 : 1, xp: xp?.xp || 0, streak: xp?.streak || 0,
    badges: xp?.badges || [],
  });
});

function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const users = readJSON("users.json");
    return users.find((u) => u.id === userId) || null;
  } catch { return null; }
}

function auth(req, res, next) {
  req.user = getUser(req);
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    req.user = getUser(req);
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: `Requires one of: ${roles.join(", ")}` });
    next();
  };
}

const adminAuth = requireRole("super_admin");
const superAdminAuth = requireRole("super_admin");
const teacherAuth = requireRole("teacher", "admin", "super_admin");
const staffAuth = requireRole("teacher", "admin", "super_admin", "dev");

app.post("/api/admin/subjects", adminAuth, (req, res) => {
  const { name, code, description } = req.body;
  if (!name || !code) return res.status(400).json({ error: "Name and code required" });
  const subjects = readJSON("subjects.json");
  const sub = { id: uuidv4(), name, code, description: description || "" };
  subjects.push(sub);
  writeJSON("subjects.json", subjects);
  res.json(sub);
});

app.put("/api/admin/subjects/:id", adminAuth, (req, res) => {
  const subjects = readJSON("subjects.json");
  const idx = subjects.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  subjects[idx] = { ...subjects[idx], ...req.body };
  writeJSON("subjects.json", subjects);
  res.json(subjects[idx]);
});

app.delete("/api/admin/subjects/:id", adminAuth, (req, res) => {
  let subjects = readJSON("subjects.json");
  subjects = subjects.filter((s) => s.id !== req.params.id);
  writeJSON("subjects.json", subjects);
  res.json({ ok: true });
});

app.post("/api/admin/papers", adminAuth, (req, res) => {
  const { subjectId, title, year, grade, examType, description } = req.body;
  if (!subjectId || !title) return res.status(400).json({ error: "subjectId and title required" });
  const papers = readJSON("papers.json");
  const paper = { id: uuidv4(), subjectId, title, year: parseInt(year), grade, examType: examType || "external", description: description || "", createdAt: new Date().toISOString() };
  papers.push(paper);
  writeJSON("papers.json", papers);
  res.json(paper);
});

app.put("/api/admin/papers/:id", adminAuth, (req, res) => {
  const papers = readJSON("papers.json");
  const idx = papers.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  papers[idx] = { ...papers[idx], ...req.body };
  writeJSON("papers.json", papers);
  res.json(papers[idx]);
});

app.delete("/api/admin/papers/:id", adminAuth, (req, res) => {
  let papers = readJSON("papers.json");
  papers = papers.filter((p) => p.id !== req.params.id);
  writeJSON("papers.json", papers);
  res.json({ ok: true });
});

app.post("/api/admin/questions", adminAuth, (req, res) => {
  const { paperId, questionNumber, text, marks, modelAnswer } = req.body;
  if (!paperId || !text) return res.status(400).json({ error: "paperId and text required" });
  const questions = readJSON("questions.json");
  const q = { id: uuidv4(), paperId, questionNumber: parseInt(questionNumber), text, marks: parseInt(marks) || 3, modelAnswer: modelAnswer || "" };
  questions.push(q);
  writeJSON("questions.json", questions);
  res.json(q);
});

app.put("/api/admin/questions/:id", adminAuth, (req, res) => {
  const questions = readJSON("questions.json");
  const idx = questions.findIndex((q) => q.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  questions[idx] = { ...questions[idx], ...req.body };
  writeJSON("questions.json", questions);
  res.json(questions[idx]);
});

app.delete("/api/admin/questions/:id", adminAuth, (req, res) => {
  let questions = readJSON("questions.json");
  questions = questions.filter((q) => q.id !== req.params.id);
  writeJSON("questions.json", questions);
  res.json({ ok: true });
});

app.get("/api/admin/answers", adminAuth, (req, res) => {
  const allAnswers = readJSON("answers.json");
  const questions = readJSON("questions.json");
  const papers = readJSON("papers.json");
  const users = readJSON("users.json");
  const enriched = allAnswers.map((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    const p = papers.find((x) => x.id === q?.paperId);
    const u = users.find((x) => x.id === a.userId);
    return { ...a, question: q || null, paper: p || null, user: u ? { id: u.id, name: u.name, email: u.email } : null };
  });
  res.json(enriched);
});

app.post("/api/admin/answers/:id/review", adminAuth, (req, res) => {
  const { isCorrect, feedback } = req.body;
  const answers = readJSON("answers.json");
  const idx = answers.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  answers[idx].isCorrect = isCorrect;
  answers[idx].feedback = feedback || "";
  answers[idx].reviewStatus = "reviewed";
  writeJSON("answers.json", answers);
  res.json(answers[idx]);
});

app.get("/api/users", adminAuth, (req, res) => {
  const users = readJSON("users.json");
  res.json(users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt })));
});

app.put("/api/admin/users/:id/role", (req, res) => {
  req.user = getUser(req);
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { role } = req.body;
  const validRoles = ["student", "investor", "teacher", "dev", "admin", "super_admin", "bot", "mod_bot"];
  if (!validRoles.includes(role)) return res.status(400).json({ error: `Invalid role. Valid: ${validRoles.join(", ")}` });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  if (users[idx].role === "super_admin" && req.user.role !== "super_admin") return res.status(403).json({ error: "Only super_admin can modify super_admin" });
  if (req.user.role === "admin" && !["student", "investor", "teacher"].includes(role)) return res.status(403).json({ error: "Admin can only assign: student, investor, teacher" });
  if (req.user.role === "super_admin") {} // can assign any role
  else if (!["admin", "super_admin"].includes(req.user.role)) return res.status(403).json({ error: "Insufficient permissions" });
  users[idx].role = role;
  writeJSON("users.json", users);
  res.json({ id: users[idx].id, name: users[idx].name, email: users[idx].email, role: users[idx].role });
});

// Admin set password
app.put("/api/admin/users/:id/password", adminAuth, (req, res) => {
  const { password } = req.body;
  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  users[idx].password = bcrypt.hashSync(password, 10);
  writeJSON("users.json", users);
  adminLog("password_set", req.user.id, req.user.name, `Password reset for ${users[idx].email}`);
  res.json({ message: "Password updated" });
});

// Admin delete user
app.delete("/api/admin/users/:id", adminAuth, (req, res) => {
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  if (users[idx].role === "super_admin" && users[idx].id !== req.user.id) return res.status(403).json({ error: "Cannot delete another super_admin" });
  if (users[idx].id === req.user.id) return res.status(400).json({ error: "You cannot delete your own account" });
  const [removed] = users.splice(idx, 1);
  writeJSON("users.json", users);
  adminLog("user_deleted", req.user.id, req.user.name, `Deleted ${removed.email}`);
  res.json({ message: "User deleted", id: removed.id });
});

// Admin send notification to a user
app.post("/api/admin/users/:id/notify", adminAuth, (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ error: "title and message required" });
  const users = readJSON("users.json");
  const u = users.find((x) => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: "Not found" });
  addNotification(u.id, "admin_message", title, message, "/profile");
  res.json({ message: "Notification sent" });
});

// ─── SUBSCRIPTIONS ────────────────────────────────────────
const PLANS = {
  free: { price: 0, label: "Free", features: ["Browse past papers", "Submit answers", "View model answers"] },
  k10: { price: 10, label: "K10", features: ["Everything in Free", "AI chatbot access", "Detailed feedback", "Export results"] },
  k20: { price: 20, label: "K20", features: ["Everything in K10", "Priority grading", "Advanced analytics", "Dark mode"] },
  k30: { price: 30, label: "K30", features: ["Everything in K20", "Teacher bot access", "Unlimited answers", "Certificate of completion"] },
  k50: { price: 50, label: "K50", features: ["Everything in K30", "Become a teacher", "Create your own bots", "API access"] },
  k100: { price: 100, label: "K100", features: ["Everything in K50", "Admin panel", "Create MOD bots", "Priority support", "Custom branding"] },
};

app.get("/api/pricing", (req, res) => {
  res.json(Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan })));
});

app.put("/api/admin/users/:id/subscription", adminAuth, (req, res) => {
  const { subscription } = req.body;
  if (!PLANS[subscription]) return res.status(400).json({ error: "Invalid plan" });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  users[idx].subscription = subscription;
  writeJSON("users.json", users);
  res.json({ id: users[idx].id, name: users[idx].name, subscription: users[idx].subscription });
});

// Leaderboard
app.get("/api/leaderboard", (req, res) => {
  const answers = readJSON("answers.json");
  const users = readJSON("users.json");
  const { subjectId } = req.query;

  let filtered = answers;
  if (subjectId) {
    const questions = readJSON("questions.json");
    const papers = readJSON("papers.json");
    const paperIds = papers.filter((p) => p.subjectId === subjectId).map((p) => p.id);
    const questionIds = questions.filter((q) => paperIds.includes(q.paperId)).map((q) => q.id);
    filtered = answers.filter((a) => questionIds.includes(a.questionId));
  }

  const scores = {};
  filtered.forEach((a) => {
    if (!scores[a.userId]) scores[a.userId] = { correct: 0, total: 0 };
    scores[a.userId].total++;
    if (a.isCorrect) scores[a.userId].correct++;
  });

  const ranked = Object.entries(scores)
    .map(([userId, s]) => {
      const u = users.find((x) => x.id === userId);
      return { userId, name: u?.name || "Unknown", email: u?.email || "", correct: s.correct, total: s.total, percentage: s.total ? Math.round((s.correct / s.total) * 100) : 0 };
    })
    .sort((a, b) => b.percentage - a.percentage || b.total - a.total);

  res.json(ranked);
});

// Settings
app.get("/api/admin/settings", adminAuth, (req, res) => {
  const settings = readJSON("settings.json");
  res.json(settings);
});

app.put("/api/admin/settings", adminAuth, (req, res) => {
  const current = readJSON("settings.json");
  const updated = { ...current, ...req.body };
  writeJSON("settings.json", updated);
  res.json(updated);
});

// AI Generate Model Answer
app.post("/api/admin/generate-answer", adminAuth, async (req, res) => {
  const { question, subject } = req.body;
  if (!question) return res.status(400).json({ error: "Question text is required" });
  const result = await askFreeAI([
    { role: "system", content: `You are a Zambian ECZ ${subject || "exam"} expert. Provide a concise, accurate model answer for the question. Keep answers brief and exam-appropriate.` },
    { role: "user", content: question },
  ], 300);
  if (!result.text) return res.status(503).json({ error: "AI generation failed. " + (result.error || "Configure an API key in Settings.") });
  res.json({ answer: result.text, provider: result.provider });
});

// Profile routes
app.put("/api/auth/profile", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const users = readJSON("users.json");
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return res.status(404).json({ error: "User not found" });
    const { name } = req.body;
    if (name) users[idx].name = name;
    writeJSON("users.json", users);
    res.json({ id: users[idx].id, name: users[idx].name, email: users[idx].email, role: users[idx].role });
  } catch { res.status(401).json({ error: "Invalid token" }); }
});

app.post("/api/auth/change-password", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new password required" });
    const pwErr = validatePassword(newPassword);
    if (pwErr) return res.status(400).json({ error: pwErr });
    const users = readJSON("users.json");
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return res.status(404).json({ error: "User not found" });
    if (!bcrypt.compareSync(currentPassword, users[idx].password)) return res.status(400).json({ error: "Current password incorrect" });
    users[idx].password = bcrypt.hashSync(newPassword, 10);
    writeJSON("users.json", users);
    res.json({ message: "Password updated" });
  } catch { res.status(401).json({ error: "Invalid token" }); }
});

// Stats for admin
app.get("/api/admin/stats", adminAuth, (req, res) => {
  const subjects = readJSON("subjects.json");
  const papers = readJSON("papers.json");
  const questions = readJSON("questions.json");
  const answers = readJSON("answers.json");
  const users = readJSON("users.json");

  const byGrade = { "9": 0, "10": 0, "12": 0 };
  papers.forEach((p) => { if (byGrade[p.grade] !== undefined) byGrade[p.grade]++; });

  const correct = answers.filter((a) => a.isCorrect).length;
  const pending = answers.filter((a) => a.reviewStatus === "pending").length;

  const dailyActivity = {};
  answers.forEach((a) => {
    const day = a.createdAt?.slice(0, 10);
    if (day) dailyActivity[day] = (dailyActivity[day] || 0) + 1;
  });

  res.json({
    subjects: subjects.length,
    papers: papers.length,
    questions: questions.length,
    users: users.length,
    answers: answers.length,
    correct,
    pending,
    byGrade,
    dailyActivity: Object.entries(dailyActivity).slice(-14).map(([date, count]) => ({ date, count })),
  });
});

// ─── BOT SYSTEM ──────────────────────────────────────────────
app.post("/api/admin/bots", adminAuth, async (req, res) => {
  const { name, subjects, description, systemPrompt } = req.body;
  if (!name) return res.status(400).json({ error: "Bot name required" });
  const users = readJSON("users.json");
  const botId = uuidv4();
  const apiKey = `johnbot-${botId}-${Date.now().toString(36)}`;
  const bot = { id: botId, name, email: `bot-${botId}@johnweb.com`, password: bcrypt.hashSync(apiKey, 10), role: "bot", subjects: subjects || [], description: description || "", systemPrompt: systemPrompt || "", apiKeyHash: bcrypt.hashSync(apiKey, 10), createdAt: new Date().toISOString() };
  users.push(bot);
  writeJSON("users.json", users);
  res.json({ id: bot.id, name: bot.name, apiKey, subjects: bot.subjects, description: bot.description, systemPrompt: bot.systemPrompt });
});

// Admin reset a bot's API key (new key shown once)
app.post("/api/admin/bots/:id/reset-key", adminAuth, (req, res) => {
  const users = readJSON("users.json");
  const bot = users.find((u) => (u.role === "bot" || u.role === "mod_bot") && u.id === req.params.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });
  const apiKey = `${bot.role === "mod_bot" ? "modbot" : "johnbot"}-${bot.id}-${Date.now().toString(36)}`;
  bot.apiKeyHash = bcrypt.hashSync(apiKey, 10);
  delete bot.apiKey;
  writeJSON("users.json", users);
  adminLog("bot_key_reset", req.user.id, req.user.name, `Reset key for bot ${bot.name}`);
  res.json({ id: bot.id, name: bot.name, apiKey });
});

// Admin update a bot's description / system prompt
app.put("/api/admin/bots/:id/prompt", adminAuth, (req, res) => {
  const { description, systemPrompt } = req.body;
  const users = readJSON("users.json");
  const bot = users.find((u) => (u.role === "bot" || u.role === "mod_bot") && u.id === req.params.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });
  if (description !== undefined) bot.description = description;
  if (systemPrompt !== undefined) bot.systemPrompt = systemPrompt;
  writeJSON("users.json", users);
  adminLog("bot_prompt_updated", req.user.id, req.user.name, `Updated prompt for ${bot.name}`);
  res.json({ id: bot.id, name: bot.name, description: bot.description, systemPrompt: bot.systemPrompt });
});

app.get("/api/bots", (req, res) => {
  const users = readJSON("users.json").filter((u) => u.role === "bot");
  const ratings = readJSON("ratings.json");
  const bots = users.map((b) => {
    const botRatings = ratings.filter((r) => r.targetId === b.id);
    const avg = botRatings.length ? (botRatings.reduce((s, r) => s + r.score, 0) / botRatings.length) : 0;
    return { id: b.id, name: b.name, subjects: b.subjects || [], description: b.description || "", rating: Math.round(avg * 10) / 10, ratingCount: botRatings.length, createdAt: b.createdAt };
  });
  res.json(bots);
});

// Bot auth via API key
function botKeyMatches(bot, key) {
  if (bot?.apiKeyHash) return bcrypt.compareSync(key, bot.apiKeyHash);
  if (bot?.apiKey) return bot.apiKey === key;
  return false;
}

function botAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const key = auth.slice(7);
  if (!key.startsWith("johnbot-")) return res.status(401).json({ error: "Invalid bot key" });
  const users = readJSON("users.json");
  const bot = users.find((u) => u.role === "bot" && botKeyMatches(u, key));
  if (!bot) return res.status(401).json({ error: "Bot not found" });
  req.bot = bot;
  next();
}

// Chat with a bot
app.post("/api/chat/:botId", async (req, res) => {
  const { botId } = req.params;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  const users = readJSON("users.json");
  const bot = users.find((u) => u.id === botId && u.role === "bot");
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  const systemPrompt = bot.systemPrompt || `You are ${bot.name}, a Zambian ECZ tutor bot. Help students understand past paper questions. Be concise and educational.`;
  const result = await askFreeAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ], 500);

  if (!result.text) return res.status(503).json({ error: "AI unavailable. " + (result.error || "Configure an API key in Settings.") });
  res.json({ reply: result.text, provider: result.provider });
});

// Bot auto-grade via API key
app.post("/api/bot/grade", botAuth, (req, res) => {
  const { answerId, isCorrect, feedback } = req.body;
  if (!answerId) return res.status(400).json({ error: "answerId required" });
  const answers = readJSON("answers.json");
  const idx = answers.findIndex((a) => a.id === answerId);
  if (idx === -1) return res.status(404).json({ error: "Answer not found" });
  answers[idx].isCorrect = isCorrect ?? answers[idx].isCorrect;
  answers[idx].feedback = feedback || `Graded by ${req.bot.name}`;
  answers[idx].reviewStatus = "reviewed";
  answers[idx].gradedBy = req.bot.id;
  writeJSON("answers.json", answers);
  addNotification(answers[idx].userId, "answer_graded", "Answer Reviewed", `Your answer was reviewed by ${req.bot.name}.`, `/profile`);
  res.json(answers[idx]);
});

// ─── RATING SYSTEM ───────────────────────────────────────────
app.post("/api/ratings", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const { targetId, score, comment, targetType } = req.body;
    if (!targetId || !score || !targetType) return res.status(400).json({ error: "targetId, score, targetType required" });
    if (score < 1 || score > 5) return res.status(400).json({ error: "Score must be 1-5" });
    if (userId === targetId) return res.status(400).json({ error: "Cannot rate yourself" });
    const ratings = readJSON("ratings.json");
    const existing = ratings.findIndex((r) => r.raterId === userId && r.targetId === targetId);
    if (existing >= 0) ratings[existing] = { ...ratings[existing], score, comment, createdAt: new Date().toISOString() };
    else ratings.push({ id: uuidv4(), raterId: userId, targetId, score, comment: comment || "", targetType, createdAt: new Date().toISOString() });
    writeJSON("ratings.json", ratings);
    addNotification(targetId, "new_rating", "New Rating", `You received a ${score}-star rating.`, `/profile`);
    res.json({ message: "Rating saved" });
  } catch { res.status(401).json({ error: "Invalid token" }); }
});

app.get("/api/ratings/:userId", (req, res) => {
  const ratings = readJSON("ratings.json").filter((r) => r.targetId === req.params.userId);
  const users = readJSON("users.json");
  const enriched = ratings.map((r) => {
    const u = users.find((x) => x.id === r.raterId);
    return { ...r, raterName: u?.name || "Unknown" };
  });
  const avg = ratings.length ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length) : 0;
  res.json({ ratings: enriched, average: Math.round(avg * 10) / 10, count: ratings.length });
});

// ─── NOTIFICATIONS ───────────────────────────────────────────
function addNotification(userId, type, title, message, link) {
  const notifs = readJSON("notifications.json");
  notifs.push({ id: uuidv4(), userId, type, title, message, link: link || "/", read: false, createdAt: new Date().toISOString() });
  writeJSON("notifications.json", notifs);
}

app.get("/api/notifications", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const all = readJSON("notifications.json").filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unread = all.filter((n) => !n.read).length;
    res.json({ notifications: all.slice(0, 50), unread });
  } catch { res.status(401).json({ error: "Invalid token" }); }
});

app.post("/api/notifications/:id/read", (req, res) => {
  const notifs = readJSON("notifications.json");
  const idx = notifs.findIndex((n) => n.id === req.params.id);
  if (idx >= 0) { notifs[idx].read = true; writeJSON("notifications.json", notifs); }
  res.json({ ok: true });
});

app.post("/api/notifications/read-all", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const notifs = readJSON("notifications.json");
    notifs.forEach((n) => { if (n.userId === userId) n.read = true; });
    writeJSON("notifications.json", notifs);
    res.json({ ok: true });
  } catch { res.status(401).json({ error: "Invalid token" }); }
});

// Auto-notify on answer graded
app.post("/api/answers", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const { questionId, content } = req.body;
    if (!questionId || !content) return res.status(400).json({ error: "questionId and content required" });
    const questions = readJSON("questions.json");
    const question = questions.find((q) => q.id === questionId);
    if (!question) return res.status(404).json({ error: "Question not found" });
    const autoCorrect = content.toLowerCase().trim() === question.modelAnswer.toLowerCase().trim();
    const answers = readJSON("answers.json");
    const existing = answers.find((a) => a.questionId === questionId && a.userId === userId);
    if (existing) {
      if (existing.content === content) return res.json({ ...existing, duplicate: true });
      existing.content = content;
      existing.isCorrect = autoCorrect;
      existing.reviewStatus = autoCorrect ? "auto-approved" : "pending";
      existing.feedback = "";
      existing.updatedAt = new Date().toISOString();
      writeJSON("answers.json", answers);
      return res.json(existing);
    }
    const answer = { id: uuidv4(), questionId, userId, content, isCorrect: autoCorrect, feedback: "", reviewStatus: autoCorrect ? "auto-approved" : "pending", createdAt: new Date().toISOString() };
    answers.push(answer);
    writeJSON("answers.json", answers);
    if (!autoCorrect) {
      const admins = readJSON("users.json").filter((u) => ["admin", "super_admin"].includes(u.role));
      admins.forEach((a) => addNotification(a.id, "pending_review", "Answer Needs Review", "A student answer needs your review.", "/admin"));
    }
    awardXp(userId, autoCorrect ? 20 : 10, autoCorrect ? "Correct answer" : "Submitted answer");
    res.json(answer);
  } catch { res.status(401).json({ error: "Invalid token" }); }
});

// ─── EXPORT ──────────────────────────────────────────────────
app.get("/api/export/csv", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { userId } = jwt.verify(auth.slice(7), JWT_SECRET);
    const answers = readJSON("answers.json").filter((a) => a.userId === userId);
    const questions = readJSON("questions.json");
    const papers = readJSON("papers.json");
    let csv = "Date,Paper,Question,Your Answer,Model Answer,Correct,Feedback\n";
    answers.forEach((a) => {
      const q = questions.find((x) => x.id === a.questionId);
      const p = papers.find((x) => x.id === q?.paperId);
      const date = a.createdAt ? a.createdAt.slice(0, 10) : "";
      const paperTitle = p?.title || "?";
      const qText = q?.text ? `"${q.text.replace(/"/g, '""')}"` : "?";
      const answer = `"${a.content.replace(/"/g, '""')}"`;
      const model = q?.modelAnswer ? `"${q.modelAnswer.replace(/"/g, '""')}"` : "?";
      csv += `${date},${paperTitle},${qText},${answer},${model},${a.isCorrect ? "Yes" : "No"},"${a.feedback}"\n`;
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=johnweb-results.csv");
    res.send(csv);
  } catch { res.status(401).json({ error: "Invalid token" }); }
});

// ─── MOD BOT ──────────────────────────────────────────────
app.post("/api/admin/mod-bots", adminAuth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const users = readJSON("users.json");
  const botId = uuidv4();
  const apiKey = `modbot-${botId}-${Date.now().toString(36)}`;
  const bot = { id: botId, name, email: `mod-${botId}@johnweb.com`, password: bcrypt.hashSync(apiKey, 10), role: "mod_bot", apiKeyHash: bcrypt.hashSync(apiKey, 10), createdAt: new Date().toISOString() };
  users.push(bot);
  writeJSON("users.json", users);
  res.json({ id: bot.id, name: bot.name, apiKey, role: "mod_bot" });
});

app.post("/api/modbot/flag", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const key = auth.slice(7);
  if (!key.startsWith("modbot-")) return res.status(401).json({ error: "Invalid MOD bot key" });
  const users = readJSON("users.json");
  const bot = users.find((u) => u.role === "mod_bot" && botKeyMatches(u, key));
  if (!bot) return res.status(401).json({ error: "MOD bot not found" });
  const { answerId, reason } = req.body;
  if (!answerId) return res.status(400).json({ error: "answerId required" });
  const answers = readJSON("answers.json");
  const idx = answers.findIndex((a) => a.id === answerId);
  if (idx === -1) return res.status(404).json({ error: "Answer not found" });
  answers[idx].flagged = true;
  answers[idx].flagReason = reason || "Flagged by MOD bot";
  answers[idx].flaggedBy = bot.id;
  writeJSON("answers.json", answers);
  addNotification(answers[idx].userId, "answer_flagged", "Answer Flagged", `Your answer was flagged: ${reason || "Inappropriate content"}`, `/profile`);
  const admins = readJSON("users.json").filter((u) => ["admin", "super_admin"].includes(u.role));
  admins.forEach((a) => addNotification(a.id, "flag_review", "Flagged Answer", `${bot.name} flagged an answer: ${reason || "Review needed"}`, "/admin"));
  res.json({ flagged: true });
});

// MOD bot grades / approves an answer (moderator + grader powers)
app.post("/api/modbot/review", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const key = auth.slice(7);
  if (!key.startsWith("modbot-")) return res.status(401).json({ error: "Invalid MOD bot key" });
  const users = readJSON("users.json");
  const bot = users.find((u) => u.role === "mod_bot" && botKeyMatches(u, key));
  if (!bot) return res.status(401).json({ error: "MOD bot not found" });
  const { answerId, isCorrect, feedback } = req.body;
  if (!answerId) return res.status(400).json({ error: "answerId required" });
  const answers = readJSON("answers.json");
  const idx = answers.findIndex((a) => a.id === answerId);
  if (idx === -1) return res.status(404).json({ error: "Answer not found" });
  answers[idx].isCorrect = isCorrect ?? answers[idx].isCorrect;
  answers[idx].feedback = feedback || `Reviewed by ${bot.name}`;
  answers[idx].reviewStatus = "reviewed";
  answers[idx].gradedBy = bot.id;
  writeJSON("answers.json", answers);
  addNotification(answers[idx].userId, "answer_graded", "Answer Reviewed", `Your answer was reviewed by ${bot.name}.`, "/profile");
  res.json(answers[idx]);
});

// ─── TEACHER ENDPOINTS ─────────────────────────────────────
app.post("/api/teacher/grade", teacherAuth, (req, res) => {
  const { answerId, isCorrect, feedback } = req.body;
  if (!answerId) return res.status(400).json({ error: "answerId required" });
  const answers = readJSON("answers.json");
  const idx = answers.findIndex((a) => a.id === answerId);
  if (idx === -1) return res.status(404).json({ error: "Answer not found" });
  answers[idx].isCorrect = isCorrect ?? answers[idx].isCorrect;
  answers[idx].feedback = feedback || `Graded by ${req.user.name}`;
  answers[idx].reviewStatus = "reviewed";
  answers[idx].gradedBy = req.user.id;
  writeJSON("answers.json", answers);
  addNotification(answers[idx].userId, "answer_graded", "Answer Reviewed", `Your answer was reviewed by ${req.user.name}.`, "/profile");
  res.json(answers[idx]);
});

app.get("/api/teacher/pending", teacherAuth, (req, res) => {
  const answers = readJSON("answers.json").filter((a) => a.reviewStatus === "pending");
  const questions = readJSON("questions.json");
  const papers = readJSON("papers.json");
  const users = readJSON("users.json");
  res.json(answers.map((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    const p = papers.find((x) => x.id === q?.paperId);
    const u = users.find((x) => x.id === a.userId);
    return { ...a, question: q || null, paper: p || null, student: u ? { name: u.name, email: u.email } : null };
  }));
});

// ─── DEV ENDPOINTS ────────────────────────────────────────
app.get("/api/dev/system", staffAuth, (req, res) => {
  if (req.user.role !== "dev" && req.user.role !== "admin" && req.user.role !== "super_admin") return res.status(403).json({ error: "Dev access required" });
  const dataDir = fs.readdirSync(DATA_DIR);
  const stats = dataDir.map((f) => {
    const fp = path.join(DATA_DIR, f);
    return { file: f, size: fs.statSync(fp).size, records: JSON.parse(fs.readFileSync(fp, "utf-8")).length };
  });
  res.json({ node: process.version, platform: process.platform, uptime: process.uptime(), memory: process.memoryUsage(), files: stats });
});

// ─── INVESTOR ANALYTICS ──────────────────────────────────
app.get("/api/investor/analytics", requireRole("investor", "admin", "super_admin"), (req, res) => {
  const subjects = readJSON("subjects.json");
  const papers = readJSON("papers.json");
  const answers = readJSON("answers.json");
  const users = readJSON("users.json");
  const ratings = readJSON("ratings.json");

  const totalRatings = ratings.length;
  const avgRating = totalRatings ? ratings.reduce((s, r) => s + r.score, 0) / totalRatings : 0;
  const activeStudents = new Set(answers.map((a) => a.userId)).size;
  const byRole = {};
  users.forEach((u) => { byRole[u.role] = (byRole[u.role] || 0) + 1; });

  res.json({
    totalUsers: users.length, totalStudents: users.filter((u) => u.role === "student").length,
    totalTeachers: users.filter((u) => ["teacher", "bot", "mod_bot"].includes(u.role)).length,
    totalSubjects: subjects.length, totalPapers: papers.length,
    totalAnswers: answers.length, activeStudents, avgRating: Math.round(avgRating * 100) / 100,
    usersByRole: byRole,
    engagement: { correct: answers.filter((a) => a.isCorrect).length, pending: answers.filter((a) => a.reviewStatus === "pending").length },
  });
});

// ─── INVESTOR DASHBOARD ───────────────────────────────────
app.get("/api/investor/dashboard", requireRole("investor", "admin", "super_admin"), (req, res) => {
  const subjects = readJSON("subjects.json");
  const papers = readJSON("papers.json");
  const answers = readJSON("answers.json");
  const users = readJSON("users.json");
  const ratings = readJSON("ratings.json");
  const totalRatings = ratings.length;
  const avgRating = totalRatings ? ratings.reduce((s, r) => s + r.score, 0) / totalRatings : 0;
  const activeStudents = new Set(answers.map((a) => a.userId)).size;
  const byRole = {};
  users.forEach((u) => { byRole[u.role] = (byRole[u.role] || 0) + 1; });
  const dailyActivity = {};
  answers.forEach((a) => {
    const day = a.createdAt?.slice(0, 10);
    if (day) dailyActivity[day] = (dailyActivity[day] || 0) + 1;
  });
  res.json({
    totalUsers: users.length, totalStudents: users.filter((u) => u.role === "student").length,
    totalTeachers: users.filter((u) => ["teacher", "bot", "mod_bot"].includes(u.role)).length,
    totalSubjects: subjects.length, totalPapers: papers.length,
    totalAnswers: answers.length, activeStudents, avgRating: Math.round(avgRating * 100) / 100,
    usersByRole: byRole,
    engagement: { correct: answers.filter((a) => a.isCorrect).length, pending: answers.filter((a) => a.reviewStatus === "pending").length },
    dailyActivity: Object.entries(dailyActivity).slice(-30).map(([date, count]) => ({ date, count })),
  });
});

// ─── SEARCH ────────────────────────────────────────────────
app.get("/api/search", (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  const query = q.toLowerCase();
  const papers = readJSON("papers.json");
  const subjects = readJSON("subjects.json");
  const results = papers.filter((p) => p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
  res.json(results.map((p) => {
    const s = subjects.find((x) => x.id === p.subjectId);
    return { ...p, subjectName: s?.name || "?" };
  }));
});

// ─── FOLLOW SYSTEM ──────────────────────────────────────────
app.post("/api/follow/:targetId", auth, (req, res) => {
  const { targetId } = req.params;
  if (req.user.id === targetId) return res.status(400).json({ error: "Cannot follow yourself" });
  const follows = readJSON("follows.json");
  const existing = follows.findIndex((f) => f.followerId === req.user.id && f.targetId === targetId);
  if (existing >= 0) return res.json({ following: true });
  follows.push({ id: uuidv4(), followerId: req.user.id, targetId, createdAt: new Date().toISOString() });
  writeJSON("follows.json", follows);
  addNotification(targetId, "new_follower", "New Follower", `${req.user.name} is now following you!`, `/profile`);
  res.json({ following: true });
});

app.delete("/api/follow/:targetId", auth, (req, res) => {
  let follows = readJSON("follows.json");
  follows = follows.filter((f) => !(f.followerId === req.user.id && f.targetId === req.params.targetId));
  writeJSON("follows.json", follows);
  res.json({ following: false });
});

app.get("/api/follow/status/:targetId", auth, (req, res) => {
  const follows = readJSON("follows.json");
  const following = follows.some((f) => f.followerId === req.user.id && f.targetId === req.params.targetId);
  const count = follows.filter((f) => f.targetId === req.params.targetId).length;
  res.json({ following, count });
});

app.get("/api/follow/following", auth, (req, res) => {
  const follows = readJSON("follows.json").filter((f) => f.followerId === req.user.id);
  const users = readJSON("users.json");
  res.json(follows.map((f) => {
    const u = users.find((x) => x.id === f.targetId);
    return { id: f.targetId, name: u?.name || "Unknown", role: u?.role, email: u?.email };
  }));
});

app.get("/api/follow/followers", auth, (req, res) => {
  const follows = readJSON("follows.json");
  const myFollowers = follows.filter((f) => f.targetId === req.user.id);
  const users = readJSON("users.json");
  res.json(myFollowers.map((f) => {
    const u = users.find((x) => x.id === f.followerId);
    return { id: f.followerId, name: u?.name || "Unknown", role: u?.role, email: u?.email };
  }));
});

// ─── NEWS SYSTEM ──────────────────────────────────────────
app.get("/api/news", (req, res) => {
  const news = readJSON("news.json").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(news);
});

app.post("/api/admin/news", adminAuth, (req, res) => {
  const { title, content, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content required" });
  const news = readJSON("news.json");
  const item = { id: uuidv4(), title, content, category: category || "general", author: req.user.name, createdAt: new Date().toISOString() };
  news.push(item);
  writeJSON("news.json", news);
  res.json(item);
});

app.delete("/api/admin/news/:id", adminAuth, (req, res) => {
  let news = readJSON("news.json");
  news = news.filter((n) => n.id !== req.params.id);
  writeJSON("news.json", news);
  res.json({ ok: true });
});

// ─── CONTACT ───────────────────────────────────────────────
app.post("/api/contact", (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: "Name, email, and message required" });
  const contacts = readJSON("contacts.json");
  contacts.push({ id: uuidv4(), name, email, subject: subject || "General", message, createdAt: new Date().toISOString() });
  writeJSON("contacts.json", contacts);
  const admins = readJSON("users.json").filter((u) => ["admin", "super_admin"].includes(u.role));
  admins.forEach((a) => addNotification(a.id, "new_contact", "New Contact Message", `${name} sent: ${message.slice(0, 50)}...`, "/admin"));
  res.json({ message: "Message sent successfully" });
});

app.get("/api/admin/contacts", adminAuth, (req, res) => {
  const contacts = readJSON("contacts.json").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(contacts);
});

// ─── BOT TOOLS ─────────────────────────────────────────────
app.post("/api/bot/quiz", botAuth, (req, res) => {
  const { subject, grade, count } = req.body;
  const questions = readJSON("questions.json");
  const papers = readJSON("papers.json");
  const paperIds = papers.filter((p) => {
    const subj = readJSON("subjects.json").find((s) => s.id === p.subjectId);
    return (!subject || subj?.name === subject) && (!grade || p.grade === grade);
  }).map((p) => p.id);
  const filtered = questions.filter((q) => paperIds.includes(q.paperId));
  const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, count || 5);
  res.json({ quiz: shuffled.map((q) => ({ id: q.id, questionNumber: q.questionNumber, text: q.text, marks: q.marks })) });
});

app.post("/api/bot/study-tips", botAuth, async (req, res) => {
  const { subject, topic } = req.body;
  const prompt = `Give 5 study tips for ${subject || "ECZ"} exam preparation${topic ? ` on the topic: ${topic}` : ""}. Keep each tip to 1-2 sentences.`;
  const result = await askFreeAI([{ role: "user", content: prompt }], 500);
  if (!result.text) return res.status(503).json({ error: "AI unavailable. " + (result.error || "Configure an API key.") });
  res.json({ tips: result.text.split("\n").filter((t) => t.trim()), provider: result.provider });
});

app.post("/api/bot/batch-grade", botAuth, (req, res) => {
  const { answerIds } = req.body;
  if (!answerIds || !Array.isArray(answerIds)) return res.status(400).json({ error: "answerIds array required" });
  const answers = readJSON("answers.json");
  const questions = readJSON("questions.json");
  const results = answerIds.map((id) => {
    const idx = answers.findIndex((a) => a.id === id);
    if (idx === -1) return { id, error: "Not found" };
    const q = questions.find((x) => x.id === answers[idx].questionId);
    const autoCorrect = q ? answers[idx].content.toLowerCase().trim() === q.modelAnswer.toLowerCase().trim() : false;
    answers[idx].isCorrect = autoCorrect;
    answers[idx].reviewStatus = autoCorrect ? "auto-approved" : "pending";
    answers[idx].gradedBy = req.bot.id;
    return { id, isCorrect: autoCorrect, reviewStatus: answers[idx].reviewStatus };
  });
  writeJSON("answers.json", answers);
  res.json({ results });
});

// ─── TEAMS ─────────────────────────────────────────────────
app.post("/api/teams", auth, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "Team name required" });
  const teams = readJSON("teams.json");
  if (teams.find((t) => t.name.toLowerCase() === name.toLowerCase())) return res.status(400).json({ error: "Team name taken" });
  if (teams.find((t) => t.members.includes(req.user.id))) return res.status(400).json({ error: "Already in a team" });
  const team = { id: uuidv4(), name, description: description || "", creatorId: req.user.id, members: [req.user.id], createdAt: new Date().toISOString() };
  teams.push(team);
  writeJSON("teams.json", teams);
  res.json(team);
});

app.post("/api/teams/:id/join", auth, (req, res) => {
  const teams = readJSON("teams.json");
  const team = teams.find((t) => t.id === req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (team.members.includes(req.user.id)) return res.status(400).json({ error: "Already in this team" });
  if (teams.find((t) => t.members.includes(req.user.id))) return res.status(400).json({ error: "Already in a team" });
  team.members.push(req.user.id);
  writeJSON("teams.json", teams);
  addNotification(team.creatorId, "team_join", "New Team Member", `${req.user.name} joined ${team.name}!`, "/teams");
  res.json(team);
});

app.post("/api/teams/:id/leave", auth, (req, res) => {
  const teams = readJSON("teams.json");
  const team = teams.find((t) => t.id === req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });
  team.members = team.members.filter((m) => m !== req.user.id);
  if (team.members.length === 0) { const idx = teams.findIndex((t) => t.id === req.params.id); teams.splice(idx, 1); }
  writeJSON("teams.json", teams);
  res.json({ left: true });
});

app.get("/api/teams", (req, res) => {
  const teams = readJSON("teams.json");
  const users = readJSON("users.json");
  const answers = readJSON("answers.json");
  res.json(teams.map((t) => {
    const memberData = t.members.map((mid) => {
      const u = users.find((x) => x.id === mid);
      const userAnswers = answers.filter((a) => a.userId === mid);
      return { id: mid, name: u?.name || "?", correct: userAnswers.filter((a) => a.isCorrect).length, total: userAnswers.length };
    });
    const totalCorrect = memberData.reduce((s, m) => s + m.correct, 0);
    const totalAnswers = memberData.reduce((s, m) => s + m.total, 0);
    return { ...t, members: memberData, totalCorrect, score: totalAnswers ? Math.round((totalCorrect / totalAnswers) * 100) : 0 };
  }).sort((a, b) => b.score - a.score));
});

// Set a shared team goal (target number of correct answers)
app.put("/api/teams/:id/goal", auth, (req, res) => {
  const { goal } = req.body;
  const value = parseInt(goal);
  if (!value || value < 1 || value > 10000) return res.status(400).json({ error: "Goal must be a number between 1 and 10000" });
  const teams = readJSON("teams.json");
  const team = teams.find((t) => t.id === req.params.id);
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (!team.members.includes(req.user.id)) return res.status(403).json({ error: "You must be a member to set the goal" });
  team.goal = value;
  writeJSON("teams.json", teams);
  res.json({ id: team.id, goal: team.goal });
});

app.get("/api/my-team", auth, (req, res) => {
  const teams = readJSON("teams.json");
  const team = teams.find((t) => t.members.includes(req.user.id));
  if (!team) return res.json(null);
  const users = readJSON("users.json");
  const answers = readJSON("answers.json");
  const memberData = team.members.map((mid) => {
    const u = users.find((x) => x.id === mid);
    const userAnswers = answers.filter((a) => a.userId === mid);
    return { id: mid, name: u?.name || "?", correct: userAnswers.filter((a) => a.isCorrect).length, total: userAnswers.length };
  });
  res.json({ ...team, members: memberData });
});

// ─── QUIZZES ───────────────────────────────────────────────
app.post("/api/admin/quizzes", adminAuth, (req, res) => {
  const { title, description, subject, grade, questions, timeLimit } = req.body;
  if (!title || !questions || !Array.isArray(questions)) return res.status(400).json({ error: "Title and questions array required" });
  const quizzes = readJSON("quizzes.json");
  const quiz = { id: uuidv4(), title, description: description || "", subject: subject || "", grade: grade || "", questions, timeLimit: timeLimit || 30, createdBy: req.user.name, createdAt: new Date().toISOString() };
  quizzes.push(quiz);
  writeJSON("quizzes.json", quizzes);
  res.json(quiz);
});

app.post("/api/teacher/quizzes", teacherAuth, (req, res) => {
  const { title, description, subject, grade, questions, timeLimit } = req.body;
  if (!title || !questions || !Array.isArray(questions)) return res.status(400).json({ error: "Title and questions array required" });
  const quizzes = readJSON("quizzes.json");
  const quiz = { id: uuidv4(), title, description: description || "", subject: subject || "", grade: grade || "", questions, timeLimit: timeLimit || 30, createdBy: req.user.name, createdAt: new Date().toISOString() };
  quizzes.push(quiz);
  writeJSON("quizzes.json", quizzes);
  res.json(quiz);
});

app.post("/api/bot/quiz-create", botAuth, async (req, res) => {
  const { subject, grade, count } = req.body;
  const questionsData = readJSON("questions.json");
  const papers = readJSON("papers.json");
  const paperIds = papers.filter((p) => {
    const subj = readJSON("subjects.json").find((s) => s.id === p.subjectId);
    return (!subject || subj?.name === subject) && (!grade || p.grade === grade);
  }).map((p) => p.id);
  const filtered = questionsData.filter((q) => paperIds.includes(q.paperId));
  const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, count || 10);
  const quizQuestions = shuffled.map((q) => ({ id: uuidv4(), questionNumber: q.questionNumber, text: q.text, marks: q.marks, modelAnswer: q.modelAnswer }));
  const quizzes = readJSON("quizzes.json");
  const quiz = { id: uuidv4(), title: `${subject || "ECZ"} Quiz`, description: `Auto-generated ${subject || "ECZ"} quiz for Grade ${grade || "all"}`, subject: subject || "", grade: grade || "", questions: quizQuestions, timeLimit: 30, createdBy: req.bot.name, createdAt: new Date().toISOString() };
  quizzes.push(quiz);
  writeJSON("quizzes.json", quizzes);
  res.json(quiz);
});

app.get("/api/quizzes", (req, res) => {
  const quizzes = readJSON("quizzes.json").map((q) => {
    const { questions, ...rest } = q;
    return { ...rest, questionCount: questions?.length || 0 };
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(quizzes);
});

app.get("/api/quizzes/:id", (req, res) => {
  const quizzes = readJSON("quizzes.json");
  const quiz = quizzes.find((q) => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  res.json(quiz);
});

app.post("/api/quizzes/:id/submit", auth, (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) return res.status(400).json({ error: "Answers array required" });
  const quizzes = readJSON("quizzes.json");
  const quiz = quizzes.find((q) => q.id === req.params.id);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  let correct = 0;
  const results = quiz.questions.map((q) => {
    const userAns = answers.find((a) => a.questionId === q.id);
    const isCorrect = userAns?.content?.toLowerCase().trim() === q.modelAnswer?.toLowerCase().trim();
    if (isCorrect) correct++;
    return { questionId: q.id, questionNumber: q.questionNumber, text: q.text, userAnswer: userAns?.content || "", modelAnswer: q.modelAnswer, isCorrect, marks: q.marks };
  });
  const result = { id: uuidv4(), quizId: quiz.id, quizTitle: quiz.title, userId: req.user.id, userName: req.user.name, score: correct, total: quiz.questions.length, percentage: Math.round((correct / quiz.questions.length) * 100), results, createdAt: new Date().toISOString() };
  const quizResults = readJSON("quiz-results.json");
  quizResults.push(result);
  writeJSON("quiz-results.json", quizResults);
  addNotification(req.user.id, "quiz_complete", "Quiz Completed", `You scored ${correct}/${quiz.questions.length} on "${quiz.title}"`, `/quizzes/${quiz.id}`);
  res.json(result);
});

app.get("/api/quiz-results/:quizId", (req, res) => {
  const results = readJSON("quiz-results.json").filter((r) => r.quizId === req.params.quizId);
  res.json(results.sort((a, b) => b.percentage - a.percentage));
});

app.get("/api/my-quiz-results", auth, (req, res) => {
  const results = readJSON("quiz-results.json").filter((r) => r.userId === req.user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(results);
});

// ─── NOTES ────────────────────────────────────────────────
app.get("/api/notes", auth, (req, res) => {
  const notes = readJSON("notes.json").filter((n) => n.userId === req.user.id).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(notes);
});

app.post("/api/notes", auth, (req, res) => {
  const { title, content, subject } = req.body;
  if (!title) return res.status(400).json({ error: "Title required" });
  const notes = readJSON("notes.json");
  const note = { id: uuidv4(), userId: req.user.id, title, content: content || "", subject: subject || "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  notes.push(note);
  writeJSON("notes.json", notes);
  res.json(note);
});

app.put("/api/notes/:id", auth, (req, res) => {
  const notes = readJSON("notes.json");
  const idx = notes.findIndex((n) => n.id === req.params.id && n.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  notes[idx] = { ...notes[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeJSON("notes.json", notes);
  res.json(notes[idx]);
});

app.delete("/api/notes/:id", auth, (req, res) => {
  let notes = readJSON("notes.json");
  const before = notes.length;
  notes = notes.filter((n) => !(n.id === req.params.id && n.userId === req.user.id));
  if (notes.length === before) return res.status(404).json({ error: "Not found" });
  writeJSON("notes.json", notes);
  res.json({ ok: true });
});

// ─── COMMENTS (Discussion Forum) ───────────────────────────
app.post("/api/comments", auth, (req, res) => {
  const { paperId, questionId, content } = req.body;
  if (!paperId || !content) return res.status(400).json({ error: "paperId and content required" });
  const comments = readJSON("comments.json");
  const comment = { id: uuidv4(), paperId, questionId: questionId || null, userId: req.user.id, userName: req.user.name, content, createdAt: new Date().toISOString() };
  comments.push(comment);
  writeJSON("comments.json", comments);
  res.json(comment);
});

app.get("/api/comments/:paperId", (req, res) => {
  const comments = readJSON("comments.json").filter((c) => c.paperId === req.params.paperId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  res.json(comments);
});

// ─── ADMIN LOGS ────────────────────────────────────────────
app.get("/api/admin/logs", adminAuth, (req, res) => {
  const logs = readJSON("admin-logs.json").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
  res.json(logs);
});

function adminLog(action, userId, userName, details) {
  const logs = readJSON("admin-logs.json");
  logs.push({ id: uuidv4(), action, userId, userName, details, createdAt: new Date().toISOString() });
  writeJSON("admin-logs.json", logs);
}

// ─── GAMIFICATION ──────────────────────────────────────────
function awardXp(userId, amount, reason) {
  const xpData = readJSON("xp.json");
  let record = xpData.find((x) => x.userId === userId);
  if (!record) { record = { id: uuidv4(), userId, xp: 0, streak: 0, badges: [], lastActivity: null }; xpData.push(record); }
  record.xp += amount || 10;
  const now = new Date();
  const today = now.toDateString();
  if (record.lastActivity) {
    const last = new Date(record.lastActivity);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) record.streak = (record.streak || 0) + 1;
    else if (diffDays > 1) record.streak = 0;
  } else record.streak = 1;
  record.lastActivity = now.toISOString();
  const badges = [];
  if (record.xp >= 100) badges.push("🥇 Beginner");
  if (record.xp >= 500) badges.push("🥈 Scholar");
  if (record.xp >= 1000) badges.push("🥉 Expert");
  if (record.xp >= 5000) badges.push("🏆 Master");
  if (record.streak >= 7) badges.push("🔥 Weekly Streak");
  if (record.streak >= 30) badges.push("⚡ Monthly Streak");
  record.badges = badges;
  writeJSON("xp.json", xpData);
}

app.get("/api/gamification/:userId", (req, res) => {
  const xpData = readJSON("xp.json");
  const xp = xpData.find((x) => x.userId === req.params.userId);
  if (!xp) return res.json({ xp: 0, level: 1, streak: 0, badges: [], nextLevelXp: 100 });
  const level = Math.floor(Math.sqrt(xp.xp / 100)) + 1;
  const nextLevelXp = (level) * (level) * 100;
  res.json({ ...xp, level, nextLevelXp });
});

app.post("/api/gamification/xp", auth, (req, res) => {
  const { amount, reason } = req.body;
  const xpData = readJSON("xp.json");
  let record = xpData.find((x) => x.userId === req.user.id);
  if (!record) { record = { id: uuidv4(), userId: req.user.id, xp: 0, streak: 0, badges: [], lastActivity: null }; xpData.push(record); }
  record.xp += amount || 10;
  const now = new Date();
  const today = now.toDateString();
  if (record.lastActivity) {
    const last = new Date(record.lastActivity);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) record.streak = (record.streak || 0) + 1;
    else if (diffDays > 1) record.streak = 0;
  } else record.streak = 1;
  record.lastActivity = now.toISOString();
  const level = Math.floor(Math.sqrt(record.xp / 100)) + 1;
  const badges = [];
  if (record.xp >= 100) badges.push("🥇 Beginner");
  if (record.xp >= 500) badges.push("🥈 Scholar");
  if (record.xp >= 1000) badges.push("🥉 Expert");
  if (record.xp >= 5000) badges.push("🏆 Master");
  if (record.streak >= 7) badges.push("🔥 Weekly Streak");
  if (record.streak >= 30) badges.push("⚡ Monthly Streak");
  record.badges = badges;
  writeJSON("xp.json", xpData);
  res.json({ xp: record.xp, level, streak: record.streak || 0, badges, nextLevelXp: (level + 1) * (level + 1) * 100 });
});

// ─── EXAM TIMETABLE ────────────────────────────────────────
const ECZ_TIMETABLE = [
  { subject: "Mathematics Paper 1", date: "2026-10-15", grade: "12", time: "08:00" },
  { subject: "Mathematics Paper 2", date: "2026-10-17", grade: "12", time: "08:00" },
  { subject: "English Paper 1", date: "2026-10-20", grade: "12", time: "08:00" },
  { subject: "English Paper 2", date: "2026-10-22", grade: "12", time: "08:00" },
  { subject: "Physics Paper 1", date: "2026-10-25", grade: "12", time: "14:00" },
  { subject: "Chemistry Paper 1", date: "2026-10-28", grade: "12", time: "08:00" },
  { subject: "Biology Paper 1", date: "2026-10-30", grade: "12", time: "14:00" },
  { subject: "Geography Paper 1", date: "2026-11-02", grade: "12", time: "08:00" },
  { subject: "History Paper 1", date: "2026-11-05", grade: "12", time: "08:00" },
  { subject: "Civic Education", date: "2026-11-08", grade: "12", time: "08:00" },
  { subject: "Computer Studies", date: "2026-11-10", grade: "12", time: "14:00" },
  { subject: "Religious Education", date: "2026-11-12", grade: "12", time: "08:00" },
  { subject: "Science", date: "2026-11-15", grade: "9", time: "08:00" },
  { subject: "Social Studies", date: "2026-11-18", grade: "9", time: "08:00" },
  { subject: "Mathematics", date: "2026-11-20", grade: "10", time: "08:00" },
  { subject: "English", date: "2026-11-22", grade: "10", time: "08:00" },
];

app.get("/api/timetable", (req, res) => {
  const { grade } = req.query;
  let data = ECZ_TIMETABLE;
  if (grade) data = data.filter((e) => e.grade === grade);
  const now = new Date();
  const enriched = data.map((e) => {
    const examDate = new Date(e.date);
    const diffMs = examDate.getTime() - now.getTime();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return { ...e, daysLeft, passed: diffMs < 0 };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json(enriched);
});

// ─── FILE UPLOAD (images only) ─────────────────────────────
import multer from "multer";
const uploadDir = path.join(DATA_DIR, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${path.extname(file.originalname || "").toLowerCase().slice(0, 6)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only image files are allowed (jpeg, png, gif, webp)"));
  },
});

app.post("/api/upload", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "File too large (max 5MB)" });
  if (err?.message?.includes("Only image files")) return res.status(400).json({ error: err.message });
  if (err?.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ error: "Unexpected file field" });
  next(err);
});

app.use("/uploads", express.static(uploadDir, { setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff") }));

// ─── PASSWORD RESET ───────────────────────────────────────
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const users = readJSON("users.json");
  const user = users.find((u) => u.email === email);
  const generic = { message: "If that email is registered, a reset link has been sent." };
  if (!user) return res.json(generic);
  const resetToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min
  const resets = readJSON("password-resets.json");
  // Invalidate any previous unused tokens for this user
  resets.forEach((r) => { if (r.userId === user.id && !r.used) r.used = true; });
  resets.push({ id: uuidv4(), userId: user.id, token: resetToken, used: false, expiresAt, createdAt: new Date().toISOString() });
  writeJSON("password-resets.json", resets);
  // Token is sent by email only — never returned to the caller
  sendEmail(user.email, "JohnWeb Password Reset", `<p>Use this reset token on the JohnWeb site:</p><p><b>${resetToken}</b></p><p>It expires in 30 minutes.</p>`);
  res.json(generic);
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Token and new password required" });
  const pwErr = validatePassword(newPassword);
  if (pwErr) return res.status(400).json({ error: pwErr });
  const resets = readJSON("password-resets.json");
  const reset = resets.find((r) => r.token === token && !r.used);
  if (!reset) return res.status(400).json({ error: "Invalid or expired token" });
  if (reset.expiresAt && new Date(reset.expiresAt) < new Date()) return res.status(400).json({ error: "Invalid or expired token" });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === reset.userId);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users[idx].password = bcrypt.hashSync(newPassword, 10);
  writeJSON("users.json", users);
  reset.used = true;
  writeJSON("password-resets.json", resets);
  res.json({ message: "Password reset successful" });
});

// ─── MOBILE MONEY ──────────────────────────────────────────
app.post("/api/payments/initiate", auth, (req, res) => {
  const { plan, phone } = req.body;
  const plans = { k10: 10, k20: 20, k30: 30, k50: 50, k100: 100 };
  if (!plans[plan]) return res.status(400).json({ error: "Invalid plan" });
  if (!phone) return res.status(400).json({ error: "Phone number required" });
  const payments = readJSON("payments.json");
  const payment = { id: uuidv4(), userId: req.user.id, plan, amount: plans[plan], phone, status: "pending", createdAt: new Date().toISOString() };
  payments.push(payment);
  writeJSON("payments.json", payments);
  adminLog("payment_initiated", req.user.id, req.user.name, `${plan} - ${phone}`);
  res.json({ message: `Payment request of K${plans[plan]} sent to ${phone}. Pay via Airtel Money or MTN Mobile Money.`, paymentId: payment.id });
});

app.get("/api/payments", auth, (req, res) => {
  const payments = readJSON("payments.json").filter((p) => p.userId === req.user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(payments);
});

app.post("/api/admin/payments/:id/confirm", adminAuth, (req, res) => {
  const payments = readJSON("payments.json");
  const idx = payments.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Payment not found" });
  payments[idx].status = "completed";
  writeJSON("payments.json", payments);
  const users = readJSON("users.json");
  const uidx = users.findIndex((u) => u.id === payments[idx].userId);
  if (uidx !== -1) { users[uidx].subscription = payments[idx].plan; writeJSON("users.json", users); }
  addNotification(payments[idx].userId, "payment_complete", "Subscription Activated", `Your ${payments[idx].plan} plan is now active!`, "/profile");
  adminLog("payment_confirmed", req.user.id, req.user.name, `${payments[idx].plan} for ${payments[idx].userId}`);
  res.json(payments[idx]);
});

// ─── EMAIL VERIFICATION ────────────────────────────────────
app.post("/api/auth/verify-email", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token required" });
  const verifications = readJSON("email-verifications.json");
  const v = verifications.find((x) => x.token === token && !x.used);
  if (!v) return res.status(400).json({ error: "Invalid or expired token" });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === v.userId);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users[idx].emailVerified = true;
  writeJSON("users.json", users);
  v.used = true;
  writeJSON("email-verifications.json", verifications);
  res.json({ message: "Email verified!" });
});

app.get("/api/auth/verification-status", auth, (req, res) => {
  res.json({ verified: req.user.emailVerified || false });
});

app.get("/api/admin/payments", adminAuth, (req, res) => {
  const payments = readJSON("payments.json").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const users = readJSON("users.json");
  res.json(payments.map((p) => { const u = users.find((x) => x.id === p.userId); return { ...p, userName: u?.name || "?" }; }));
});

// ─── AI FEEDBACK ──────────────────────────────────────────
app.post("/api/ai-feedback", auth, async (req, res) => {
  const { question, answer, modelAnswer, mode } = req.body;
  if (!question) return res.status(400).json({ error: "question required" });
  let prompt;
  if (mode === "explain") {
    if (!answer || !answer.trim()) return res.status(400).json({ error: "Write your answer first, then get an explanation." });
    prompt = `Question: ${question}\nOptions (if any): ${Array.isArray(req.body.options) ? req.body.options.join(", ") : "none"}\nStudent's (wrong) answer: ${answer}\nCorrect answer: ${modelAnswer || "N/A"}\n\nAs a patient Zambian ECZ teacher for Grade 6/7 students, explain in 3-4 short sentences WHY the correct answer is right and why the student's answer is wrong. Use a simple example. End with an encouraging note. Do not repeat "Correct:/Improve:/Tip:" format.`;
  } else {
    if (!answer || !answer.trim()) return res.status(400).json({ error: "Write your answer first, then get AI feedback." });
    prompt = `Question: ${question}\nStudent answer: ${answer}\nModel answer: ${modelAnswer || "N/A"}\n\nAs a Zambian ECZ teacher, give brief feedback (max 4 sentences): what was correct, what was missing/wrong, and a suggestion. Format: "Correct: ... | Improve: ... | Tip: ..."`;
  }
  const result = await askFreeAI([{ role: "user", content: prompt }], 300);
  if (!result.text) return res.status(503).json({ error: "AI temporarily unavailable. Try again in a minute." });
  res.json({ feedback: result.text, provider: result.provider });
});

// ─── BOOKMARKS ────────────────────────────────────────────
app.post("/api/bookmarks", auth, (req, res) => {
  const { questionId } = req.body;
  if (!questionId) return res.status(400).json({ error: "questionId required" });
  const bookmarks = readJSON("bookmarks.json");
  const existing = bookmarks.find((b) => b.userId === req.user.id && b.questionId === questionId);
  if (existing) return res.json({ bookmarked: true, id: existing.id });
  const bm = { id: uuidv4(), userId: req.user.id, questionId, createdAt: new Date().toISOString() };
  bookmarks.push(bm);
  writeJSON("bookmarks.json", bookmarks);
  res.json(bm);
});

app.delete("/api/bookmarks/:questionId", auth, (req, res) => {
  let bookmarks = readJSON("bookmarks.json");
  bookmarks = bookmarks.filter((b) => !(b.userId === req.user.id && b.questionId === req.params.questionId));
  writeJSON("bookmarks.json", bookmarks);
  res.json({ bookmarked: false });
});

app.get("/api/bookmarks", auth, (req, res) => {
  const bookmarks = readJSON("bookmarks.json").filter((b) => b.userId === req.user.id);
  const questions = readJSON("questions.json");
  const papers = readJSON("papers.json");
  res.json(bookmarks.map((b) => {
    const q = questions.find((x) => x.id === b.questionId);
    const p = papers.find((x) => x.id === q?.paperId);
    return { ...b, question: q || null, paper: p || null };
  }));
});

app.get("/api/bookmarks/status/:questionId", auth, (req, res) => {
  const bookmarks = readJSON("bookmarks.json");
  res.json({ bookmarked: bookmarks.some((b) => b.userId === req.user.id && b.questionId === req.params.questionId) });
});

// ─── PROGRESS ANALYTICS ───────────────────────────────────
app.get("/api/progress/:userId", (req, res) => {
  const answers = readJSON("answers.json").filter((a) => a.userId === req.params.userId);
  const questions = readJSON("questions.json");
  const papers = readJSON("papers.json");
  const bySubject = {};
  answers.forEach((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    const p = papers.find((x) => x.id === q?.paperId);
    const subjId = p?.subjectId || "unknown";
    if (!bySubject[subjId]) bySubject[subjId] = { correct: 0, total: 0 };
    bySubject[subjId].total++;
    if (a.isCorrect) bySubject[subjId].correct++;
  });
  const byDay = {};
  answers.forEach((a) => {
    const day = a.createdAt?.slice(0, 10);
    if (day) { if (!byDay[day]) byDay[day] = { correct: 0, total: 0 }; byDay[day].total++; if (a.isCorrect) byDay[day].correct++; }
  });
  res.json({ bySubject, byDay: Object.entries(byDay).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)) });
});

// ─── GLOBAL STATS ────────────────────────────────────────
app.get("/api/stats", (req, res) => {
  const users = readJSON("users.json");
  const papers = readJSON("papers.json");
  const questions = readJSON("questions.json");
  const answers = readJSON("answers.json");
  const students = users.filter((u) => u.role === "student").length;
  const bots = users.filter((u) => u.role === "bot" || u.role === "mod_bot").length;
  const teachers = users.filter((u) => u.role === "teacher").length;
  res.json({ students, teachers, bots, papers: papers.length, questions: questions.length, answers: answers.length });
});

// ─── API DOCS (endpoint reference) ───────────────────────
app.get("/api/docs", (req, res) => {
  res.json({
    version: "1.0",
    baseUrl: "/api",
    auth: "Use Authorization: Bearer <token> header. Bots use johnbot-* keys.",
    botKeys: ["POST /api/chat/:botId", "POST /api/bot/grade", "POST /api/bot/quiz", "POST /api/bot/study-tips", "POST /api/bot/quiz-create", "POST /api/bot/batch-grade"],
    endpoints: [
      { method: "GET", path: "/api/subjects", desc: "List all subjects with papers" },
      { method: "GET", path: "/api/papers", desc: "List papers (filter: subjectId, grade, year)" },
      { method: "GET", path: "/api/papers/:id", desc: "Paper detail with questions" },
      { method: "POST", path: "/api/answers", desc: "Submit an answer (auth)" },
      { method: "POST", path: "/api/chat/:botId", desc: "Chat with a bot" },
      { method: "GET", path: "/api/leaderboard", desc: "Student rankings" },
      { method: "GET", path: "/api/quizzes", desc: "List quizzes" },
    ],
  });
});

// ─── ACHIEVEMENTS ─────────────────────────────────────────
app.get("/api/achievements/:userId", (req, res) => {
  const xp = readJSON("xp.json").find((x) => x.userId === req.params.userId);
  const answers = readJSON("answers.json").filter((a) => a.userId === req.params.userId);
  const quizzes = readJSON("quiz-results.json").filter((r) => r.userId === req.params.userId);
  const xpVal = xp?.xp || 0;
  const level = Math.floor(Math.sqrt(xpVal / 100)) + 1;
  const streak = xp?.streak || 0;
  const total = answers.length;
  const correct = answers.filter((a) => a.isCorrect).length;
  const bestQuiz = quizzes.length ? Math.max(...quizzes.map((q) => q.percentage)) : 0;

  const defs = [
    { id: "first_answer", name: "First Steps", icon: "✏️", desc: "Submit your first answer", unlocked: total >= 1 },
    { id: "ten_answers", name: "Getting Started", icon: "📝", desc: "Submit 10 answers", unlocked: total >= 10 },
    { id: "fifty_answers", name: "Hard Worker", icon: "📚", desc: "Submit 50 answers", unlocked: total >= 50 },
    { id: "level_2", name: "Level Up", icon: "⭐", desc: "Reach Level 2", unlocked: level >= 2 },
    { id: "level_5", name: "Top Scholar", icon: "🎓", desc: "Reach Level 5", unlocked: level >= 5 },
    { id: "streak_7", name: "On Fire", icon: "🔥", desc: "7-day study streak", unlocked: streak >= 7 },
    { id: "streak_30", name: "Unstoppable", icon: "⚡", desc: "30-day study streak", unlocked: streak >= 30 },
    { id: "perfect_quiz", name: "Quiz Master", icon: "🏆", desc: "Score 100% on a quiz", unlocked: bestQuiz === 100 },
    { id: "quiz_80", name: "Quiz Champion", icon: "🎯", desc: "Score 80%+ on a quiz", unlocked: bestQuiz >= 80 },
    { id: "half_correct", name: "Accuracy Pro", icon: "💯", desc: "50%+ overall accuracy (min 10 answers)", unlocked: total >= 10 && correct / total >= 0.5 },
  ];
  const unlocked = defs.filter((d) => d.unlocked);
  const locked = defs.filter((d) => !d.unlocked);
  res.json({ unlocked, locked, level, xp: xpVal, streak, total });
});

// ─── CERTIFICATE ──────────────────────────────────────────
app.get("/api/certificate", auth, (req, res) => {
  const answers = readJSON("answers.json").filter((a) => a.userId === req.user.id);
  const xp = readJSON("xp.json").find((x) => x.userId === req.user.id);
  const correct = answers.filter((a) => a.isCorrect).length;
  const pct = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>JohnWeb Certificate</title>
<style>
  body { font-family: Georgia, serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f8fafc; margin: 0; }
  .cert { width: 800px; border: 8px double #15803d; padding: 40px; text-align: center; background: white; }
  .cert h1 { color: #15803d; font-size: 28px; margin: 10px 0; }
  .cert .line { border-top: 2px solid #e5e7eb; margin: 20px 0; }
  .cert .name { font-size: 32px; font-weight: bold; color: #1e293b; }
  .cert .sub { font-size: 18px; color: #475569; margin: 10px 0; }
  .cert .date { color: #94a3b8; margin-top: 20px; }
  .cert .footer { display: flex; justify-content: space-between; margin-top: 30px; font-size: 14px; color: #64748b; }
</style></head><body>
<div class="cert">
  <div style="font-size:20px;color:#d97706;font-weight:bold;">JOHNWEB</div>
  <h1>Certificate of Achievement</h1>
  <p>This certifies that</p>
  <div class="name">${req.user.name}</div>
  <div class="sub">has successfully practiced on the JohnWeb ECZ platform</div>
  <div class="line"></div>
  <div style="font-size:18px;color:#15803d;font-weight:bold;">${answers.length} answers · ${correct} correct · ${pct}% accuracy</div>
  <div style="font-size:16px;color:#475569;margin-top:8px;">Level ${xp ? Math.floor(Math.sqrt(xp.xp / 100)) + 1 : 1} · ${xp?.xp || 0} XP</div>
  <div class="date">Awarded on ${new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}</div>
  <div class="footer"><span>Made in Zambia 🇿🇲</span><span>www.johnweb.com</span></div>
</div></body></html>`;
  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// ─── QUIZ ANALYTICS ───────────────────────────────────────
app.get("/api/quiz-analytics/:quizId", requireRole("teacher", "admin", "super_admin"), (req, res) => {
  const quizzes = readJSON("quizzes.json");
  const quiz = quizzes.find((q) => q.id === req.params.quizId);
  if (!quiz) return res.status(404).json({ error: "Quiz not found" });
  const results = readJSON("quiz-results.json").filter((r) => r.quizId === req.params.quizId);
  const perQuestion = quiz.questions.map((q) => {
    const attempts = results.filter((r) => r.results.some((x) => x.questionId === q.id));
    const correctCount = results.reduce((acc, r) => acc + (r.results.find((x) => x.questionId === q.id)?.isCorrect ? 1 : 0), 0);
    return { questionNumber: q.questionNumber, text: q.text, attempts: attempts.length, correctCount, accuracy: attempts.length ? Math.round((correctCount / attempts.length) * 100) : 0 };
  });
  const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
  res.json({ quizTitle: quiz.title, attempts: results.length, avgScore, bestScore: results.length ? Math.max(...results.map((r) => r.percentage)) : 0, perQuestion });
});

// ─── EMAIL SENDER (SendGrid-ready) ─────────────────────────
async function sendEmail(to, subject, html) {
  const settings = readJSON("settings.json");
  const sendgridKey = settings.sendgridApiKey || process.env.SENDGRID_API_KEY;
  if (!sendgridKey) { console.log(`[EMAIL] To: ${to} | Subject: ${subject}`); return { simulated: true }; }
  try {
    const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sendgridKey}` },
      body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: "noreply@johnweb.com", name: "JohnWeb" }, subject, content: [{ type: "text/html", value: html }] }),
    });
    if (!r.ok) console.error("SendGrid error:", r.status, await r.text());
    return { sent: r.ok };
  } catch (e) { console.error("Email error:", e.message); return { error: e.message }; }
}

// ─── BACKUP SYSTEM ─────────────────────────────────────────
app.get("/api/admin/backup", adminAuth, (req, res) => {
  const backupDir = path.join(DATA_DIR, "..", "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const filename = `johnweb-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const data = {};
  files.forEach((f) => { data[f] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8")); });
  fs.writeFileSync(path.join(backupDir, filename), JSON.stringify(data, null, 2));
  adminLog("backup_created", req.user.id, req.user.name, filename);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.send(JSON.stringify(data, null, 2));
});

app.get("/api/admin/backups", adminAuth, (req, res) => {
  const backupDir = path.join(DATA_DIR, "..", "backups");
  if (!fs.existsSync(backupDir)) return res.json([]);
  const backups = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json")).map((f) => {
    const stat = fs.statSync(path.join(backupDir, f));
    return { filename: f, size: stat.size, date: stat.mtime.toISOString() };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(backups);
});

// ─── BULK QUESTION IMPORTER ───────────────────────────────
function parseQuestions(raw) {
  const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const parsed = [];
  blocks.forEach((block, bi) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    let question = "";
    const options = [];
    let answer = "";
    let marks = 2;
    lines.forEach((line) => {
      const ansMatch = line.match(/^(?:answer|ans)\s*[:=]\s*(.+)/i);
      const marksMatch = line.match(/^marks?\s*[:=]\s*(\d+)/i);
      const optMatch = line.match(/^[A-D][).\]]\s*(.+)/i);
      if (marksMatch) marks = parseInt(marksMatch[1]);
      else if (ansMatch) answer = ansMatch[1].trim();
      else if (optMatch) options.push(optMatch[1].trim());
      else {
        const cleaned = line.replace(/^\d+[.)]\s*/, "").replace(/^Q\d+[.)]\s*/i, "");
        if (question) question += " " + cleaned;
        else question = cleaned;
      }
    });
    if (!question) return;
    const type = options.length >= 2 ? "mcq" : "open";
    // For MCQ, map the answer letter (A-D) to the actual option text so
    // auto-grading and answer highlighting work correctly.
    let finalAnswer = answer;
    if (type === "mcq" && /^[A-D]$/i.test(answer.trim())) {
      finalAnswer = options[answer.trim().toUpperCase().charCodeAt(0) - 65] || answer;
    }
    parsed.push({ text: question, options, answer: finalAnswer, marks: marks || 2, type });
  });
  return parsed;
}

app.post("/api/admin/bulk-import", adminAuth, (req, res) => {
  const { paperId, text } = req.body;
  if (!paperId || !text) return res.status(400).json({ error: "paperId and text required" });
  const papers = readJSON("papers.json");
  if (!papers.find((p) => p.id === paperId)) return res.status(404).json({ error: "Paper not found" });
  const parsed = parseQuestions(text);
  if (parsed.length === 0) return res.status(400).json({ error: "No questions could be parsed" });
  const questions = readJSON("questions.json");
  const existing = questions.filter((q) => q.paperId === paperId);
  const startNum = existing.length ? Math.max(...existing.map((q) => q.questionNumber)) + 1 : 1;
  const added = [];
  parsed.forEach((p, i) => {
    questions.push({
      id: uuidv4(),
      paperId,
      questionNumber: startNum + i,
      text: p.text,
      marks: p.marks,
      modelAnswer: p.answer,
      type: p.type,
      options: p.options,
    });
    added.push({ questionNumber: startNum + i, text: p.text.slice(0, 60), type: p.type });
  });
  writeJSON("questions.json", questions);
  adminLog("bulk_import", req.user.id, req.user.name, `${added.length} questions added to ${paperId}`);
  res.json({ added: added.length, questions: added });
});

// Init empty data files
["ratings.json", "notifications.json", "follows.json", "news.json", "contacts.json", "teams.json", "quizzes.json", "quiz-results.json", "notes.json", "comments.json", "admin-logs.json", "xp.json", "password-resets.json", "email-verifications.json", "payments.json", "bookmarks.json"].forEach((f) => {
  const fp = path.join(DATA_DIR, f);
  if (!fs.existsSync(fp)) fs.writeFileSync(fp, "[]");
});

// Migrate legacy plaintext bot keys to hashed keys (called after storage init)
export function migrateData() {
  const users = readJSON("users.json");
  let changed = false;
  users.forEach((u) => {
    if ((u.role === "bot" || u.role === "mod_bot") && u.apiKey && !u.apiKeyHash) {
      u.apiKeyHash = bcrypt.hashSync(u.apiKey, 10);
      delete u.apiKey;
      changed = true;
    }
  });
  if (changed) writeJSON("users.json", users);
}

export default app;
