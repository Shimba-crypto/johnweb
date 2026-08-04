import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readJSON, writeJSON, initStorage, storageMode } from "./storage.js";

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
app.use(express.json({ limit: "1mb" }));

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
  // Hashed assets (/assets/*) can be cached forever — they change name on every build.
  app.use("/assets", express.static(path.join(DIST_DIR, "assets"), { maxAge: "365d", immutable: true }));
  // Everything else (index.html) must NOT be cached so phones get fresh code every visit.
  app.use(express.static(DIST_DIR, { index: false }));
  app.get(/^\/(?!api|uploads|backups|assets).*/, (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
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

// ─── SECURITY: token issuance, versioned verification, audit log ───
function issueTokens(user) {
  const ver = user.tokenVersion || 1;
  const accessToken = jwt.sign({ userId: user.id, ver }, JWT_SECRET, { expiresIn: "1h" });
  const refreshToken = uuidv4();
  const tokens = readJSON("refresh-tokens.json");
  tokens.push({ id: refreshToken, userId: user.id, expires: Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt: new Date().toISOString() });
  writeJSON("refresh-tokens.json", tokens);
  return { accessToken, refreshToken };
}

function verifyAuth(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = readJSON("users.json");
    const user = users.find((u) => u.id === payload.userId);
    if (!user) return null;
    if ((user.tokenVersion || 1) !== payload.ver) return null; // logged out / rotated
    return payload;
  } catch { return null; }
}

function logSecurity(action, userId, userName, details, req) {
  const logs = readJSON("admin-logs.json");
  const ip = req?.ip || req?.socket?.remoteAddress || "?";
  logs.push({ id: uuidv4(), action, userId, userName, details, ip, type: "security", createdAt: new Date().toISOString() });
  writeJSON("admin-logs.json", logs);
}

// Replace scattered jwt.verify calls with version-aware verification
function authUserId(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = verifyAuth(auth.slice(7));
  return payload ? payload.userId : null;
}

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, ref } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });
  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  const users = readJSON("users.json");
  // Generic response to avoid user enumeration
  if (users.find((u) => u.email === email)) return res.status(400).json({ error: "Unable to create account. Please check your details and try again." });
  const role = users.length === 0 ? "super_admin" : "student";
  const user = { id: uuidv4(), name, email, password: bcrypt.hashSync(password, 10), role, tokenVersion: 1, createdAt: new Date().toISOString() };
  users.push(user);
  // Referral bonus: friends who join via your link get a free week of Student Plus (k50)
  // Only regular student accounts can be referrers (admins/staff/bots excluded)
  if (ref) {
    const referrer = users.find((u) => u.id === ref);
    if (referrer && referrer.id !== user.id && referrer.role === "student") {
      const referrals = readJSON("referrals.json");
      referrals.push({ id: uuidv4(), referrerId: referrer.id, referredId: user.id, createdAt: new Date().toISOString() });
      writeJSON("referrals.json", referrals);
      setSubscription(user, "k50");
      user.subscriptionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      user.expiryNotified = false;
      addNotification(user.id, "referral_bonus", "🎁 Free Week of Student Plus!", "You got 7 days of the K50 plan thanks to your friend's invite. Enjoy!", "/profile");
      addNotification(referrer.id, "referral_friend", "🎉 A Friend Joined!", `${user.name} joined with your link — they got a free week of Student Plus!`, "/profile");
    }
  }
  writeJSON("users.json", users);
  addNotification(user.id, "welcome", "👋 Welcome to JohnWeb!", `Hi ${name}! Practice real ECZ past papers, take quizzes and earn badges. Start with a Grade 7 paper.`, "/browse");
  res.json({ message: "User created", user: { id: user.id, name: user.name, email: user.email } });
});

// School/teacher registration link — students only need a name + password.
// Tagged with the school and teacher so the teacher can see their students.
app.post("/api/register-student", (req, res) => {
  const { name, password, school, teacherName, teacherId } = req.body;
  if (!name || !password) return res.status(400).json({ error: "Name and password are required" });
  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  const users = readJSON("users.json");
  const slug = (name + (school || "jws")).toLowerCase().replace(/[^a-z0-9]+/g, ".");
  let email = `${slug}@student.johnweb.com`;
  let n = 1;
  while (users.find((u) => u.email === email)) email = `${slug}.${n++}@student.johnweb.com`;
  const user = { id: uuidv4(), name, email, password: bcrypt.hashSync(password, 10), role: "student", tokenVersion: 1, school: school || "", teacherName: teacherName || "", teacherId: teacherId || "", createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON("users.json", users);
  res.json({ message: "Registered successfully!", email, user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, teacherName: user.teacherName } });
});

// Teacher: list their students
app.get("/api/teacher/students", (req, res) => {
  const userId = authUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const users = readJSON("users.json");
  const teacher = users.find((u) => u.id === userId);
  if (!teacher) return res.status(404).json({ error: "User not found" });
  const teacherKey = teacher.teacherId || teacher.id || teacher.email;
  const students = users.filter((u) => u.role === "student" && (u.teacherId === teacherKey || u.teacherName === teacher.name));
  const answers = readJSON("answers.json");
  res.json(students.map((s) => {
    const sa = answers.filter((a) => a.userId === s.id);
    return { id: s.id, name: s.name, email: s.email, school: s.school || "", joined: s.createdAt, answers: sa.length, correct: sa.filter((a) => a.isCorrect).length };
  }));
});

const loginAttempts = new Map();

app.post("/api/auth/login", (req, res) => {
  const emailKey = String(req.body?.email || "").toLowerCase();
  const now = Date.now();
  let locked = false;
  if (emailKey) {
    const rec = loginAttempts.get(emailKey);
    if (rec && rec.lockedUntil && now < rec.lockedUntil) {
      locked = true;
    }
  }
  const { email, password } = req.body;
  const users = readJSON("users.json");
  const user = users.find((u) => u.email === email);
  if (locked) {
    logSecurity("login_locked", "", emailKey, "Account temporarily locked after repeated failures", req);
    return res.status(423).json({ error: "Account locked due to too many failed attempts. Try again in 15 minutes." });
  }
  if (!user || !bcrypt.compareSync(password, user.password)) {
    if (emailKey) {
      const rec = loginAttempts.get(emailKey) || { fails: 0, lockedUntil: 0 };
      rec.fails = (rec.fails || 0) + 1;
      if (rec.fails >= 5) {
        rec.lockedUntil = now + 15 * 60 * 1000;
        rec.fails = 0;
        logSecurity("account_locked", user?.id || "", emailKey, "5 failed login attempts", req);
      } else {
        loginAttempts.set(emailKey, rec);
      }
    }
    return res.status(401).json({ error: "Invalid credentials" });
  }
  if (user.banned) {
    addNotification(user.id, "banned", "Account Banned", `Your account has been banned${user.banReason ? `: ${user.banReason}` : "."}`, "/");
    return res.status(403).json({ error: `Your account has been banned${user.banReason ? `: ${user.banReason}` : "."}`, banned: true, banReason: user.banReason });
  }
  if (emailKey) loginAttempts.delete(emailKey);
  const tokens = issueTokens(user);
  res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, subscription: user.subscription || "free", subscriptionExpiresAt: user.subscriptionExpiresAt || null } });
});

app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
  const tokens = readJSON("refresh-tokens.json");
  const idx = tokens.findIndex((t) => t.id === refreshToken);
  if (idx === -1) return res.status(401).json({ error: "Invalid refresh token" });
  if (tokens[idx].expires < Date.now()) {
    tokens.splice(idx, 1);
    writeJSON("refresh-tokens.json", tokens);
    return res.status(401).json({ error: "Refresh token expired" });
  }
  const user = readJSON("users.json").find((u) => u.id === tokens[idx].userId);
  if (!user) return res.status(401).json({ error: "User not found" });
  tokens.splice(idx, 1); // rotate: revoke old
  writeJSON("refresh-tokens.json", tokens);
  const newTokens = issueTokens(user);
  res.json({ token: newTokens.accessToken, refreshToken: newTokens.refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, subscription: user.subscription || "free", subscriptionExpiresAt: user.subscriptionExpiresAt || null } });
});

app.post("/api/auth/logout-all", (req, res) => {
  const userId = authUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users[idx].tokenVersion = (users[idx].tokenVersion || 1) + 1; // invalidates every old JWT
  writeJSON("users.json", users);
  let tokens = readJSON("refresh-tokens.json").filter((t) => t.userId !== userId);
  writeJSON("refresh-tokens.json", tokens);
  logSecurity("logout_all", userId, users[idx].name, "All sessions revoked", req);
  res.json({ ok: true });
});

app.get("/api/auth/me", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyAuth(auth.slice(7));
  if (!payload) return res.status(401).json({ error: "Invalid token" });
  const users = readJSON("users.json");
  const user = users.find((u) => u.id === payload.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, subscription: user.subscription || "free", subscriptionExpiresAt: user.subscriptionExpiresAt || null });
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
  try { trackPaperView(paper.id); } catch {}
  res.json({ ...paper, questions });
});

// Get the logged-in student's results for a paper
app.get("/api/papers/:id/results", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  const payload = verifyAuth(auth.slice(7));
  if (!payload) return res.status(401).json({ error: "Invalid token" });
  const papers = readJSON("papers.json");
  const paper = papers.find((p) => p.id === req.params.id);
  if (!paper) return res.status(404).json({ error: "Not found" });
  const questions = readJSON("questions.json").filter((q) => q.paperId === paper.id);
  const answers = readJSON("answers.json").filter((a) => a.userId === payload.userId);
  const results = questions.map((q) => {
    const a = answers.find((x) => x.questionId === q.id);
    const answered = Boolean(a && a.content && a.content.trim());
    return {
      questionId: q.id, questionNumber: q.questionNumber, text: q.text, marks: q.marks,
      options: q.options || [], userAnswer: a?.content || "", modelAnswer: q.modelAnswer,
      isCorrect: answered ? a.isCorrect : null, answered,
    };
  });
  const attempted = results.filter((r) => r.answered);
  const correct = attempted.filter((r) => r.isCorrect).length;
  res.json({ paperId: paper.id, title: paper.title, totalQuestions: questions.length, attempted: attempted.length, correct, results });
});

// Overall AI feedback for a completed paper
app.post("/api/paper-feedback", auth, async (req, res) => {
  const { title, results } = req.body;
  if (!results || !Array.isArray(results)) return res.status(400).json({ error: "results required" });
  const attempted = results.filter((r) => r.answered);
  const correct = attempted.filter((r) => r.isCorrect).length;
  const wrong = attempted.filter((r) => !r.isCorrect);
  const prompt = `You are a Zambian ECZ teacher. A Grade 6/7 student just finished the paper "${title}".
They got ${correct}/${attempted.length} correct.
${wrong.length > 0 ? `Questions they got WRONG:\n${wrong.slice(0, 5).map((r, i) => `${i + 1}. ${r.text} (correct answer: ${r.modelAnswer})`).join("\n")}` : "They got everything right!"}
Give a short overall summary (max 5 sentences): what they did well, the topics to improve (from the wrong questions), and one encouraging tip. Use simple Grade 6/7 language.`;
  const result = await askFreeAI([{ role: "user", content: prompt }], 400);
  if (!result.text) return res.status(503).json({ error: "AI temporarily unavailable. Try again in a minute." });
  res.json({ feedback: result.text, provider: result.provider });
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
    const payload = verifyAuth(auth.slice(7)); if (!payload) return res.status(401).json({ error: "Invalid token" }); const userId = payload.userId;
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

const ROLE_HIERARCHY = ["student", "investor", "teacher", "dev", "admin", "super_admin", "omni_super"];

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
  // omni_super bypasses the admin secret (highest level of access)
  const authUser = getUser(req);
  if (authUser && authUser.role === "omni_super") return next();
  const secret = getAdminSecret();
  if (!secret) return res.status(403).json({ error: "Admin management is disabled. Configure ADMIN_SECRET." });
  const provided = req.headers["x-admin-secret"];
  if (!provided || provided !== secret) return res.status(403).json({ error: "Admin secret required or incorrect" });
  next();
}

// Public profile must be registered BEFORE the admin-secret middleware below.
app.get("/api/users/:id/public", (req, res) => {
  const users = readJSON("users.json");
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const answers = readJSON("answers.json").filter((a) => a.userId === user.id);
  const ratings = readJSON("ratings.json").filter((r) => r.targetId === user.id);
  const xp = readJSON("xp.json").find((x) => x.userId === user.id);
  const correct = answers.filter((a) => a.isCorrect).length;
  res.json({
    id: user.id, name: user.name, role: user.role, avatar: user.avatar || null,
    createdAt: user.createdAt, totalAnswers: answers.length, correct,
    percentage: answers.length ? Math.round((correct / answers.length) * 100) : 0,
    avgRating: ratings.length ? Math.round((ratings.reduce((s, r) => s + r.score, 0) / ratings.length) * 10) / 10 : 0,
    ratingCount: ratings.length, level: xp ? Math.floor(Math.sqrt(xp.xp / 100)) + 1 : 1, xp: xp?.xp || 0, streak: xp?.streak || 0,
    badges: xp?.badges || [],
  });
});

app.use("/api/admin", adminSecret);
app.use("/api/users", adminSecret);

function getUser(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  const payload = verifyAuth(auth.slice(7));
  if (!payload) return null;
  const users = readJSON("users.json");
  const u = users.find((x) => x.id === payload.userId);
  if (!u || u.banned) return null; // banned users have no access
  return u;
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

const adminAuth = requireRole("super_admin", "omni_super");
const superAdminAuth = requireRole("super_admin", "omni_super");
const teacherAuth = requireRole("teacher", "admin", "super_admin", "omni_super");
const staffAuth = requireRole("teacher", "admin", "super_admin", "dev", "omni_super");

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
  const validRoles = ["student", "investor", "teacher", "dev", "admin", "super_admin", "omni_super", "bot", "mod_bot"];
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

// Ban / unban users
app.post("/api/admin/users/:id/ban", adminAuth, (req, res) => {
  const { reason } = req.body;
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  if (users[idx].role === "omni_super") return res.status(403).json({ error: "Cannot ban an omni_super" });
  if (users[idx].id === req.user.id) return res.status(400).json({ error: "You can't ban yourself" });
  users[idx].banned = true;
  users[idx].banReason = reason || "Violation of terms";
  users[idx].bannedAt = new Date().toISOString();
  users[idx].bannedBy = req.user.id;
  writeJSON("users.json", users);
  adminLog("user_banned", req.user.id, req.user.name, `${users[idx].email}: ${users[idx].banReason}`);
  addNotification(users[idx].id, "banned", "Account Banned", `Your account has been banned: ${users[idx].banReason}`, "/");
  res.json({ banned: true, reason: users[idx].banReason });
});

app.post("/api/admin/users/:id/unban", adminAuth, (req, res) => {
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users[idx].banned = false;
  users[idx].banReason = undefined;
  users[idx].bannedAt = undefined;
  users[idx].bannedBy = undefined;
  writeJSON("users.json", users);
  adminLog("user_unbanned", req.user.id, req.user.name, `${users[idx].email}`);
  addNotification(users[idx].id, "unbanned", "Account Unbanned", "Your account has been unbanned. You can log in again.", "/login");
  res.json({ banned: false });
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
  k200: { price: 200, label: "K200 Teacher", features: ["Teacher account", "Grade student answers", "Create quizzes", "Manage a class", "View student progress", "Everything in K100"] },
};

app.get("/api/pricing", (req, res) => {
  res.json(Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan })));
});

// Set a user's subscription (30-day period) and clear the expiry-notice flag
function setSubscription(user, plan) {
  user.subscription = plan;
  if (plan && plan !== "free") {
    user.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    user.expiryNotified = false;
  } else {
    user.subscriptionExpiresAt = null;
    user.expiryNotified = false;
  }
}

// Notify users whose subscription is expiring (or has expired)
export function checkSubscriptions() {
  const users = readJSON("users.json");
  let changed = false;
  users.forEach((u) => {
    if (!u.subscription || u.subscription === "free" || !u.subscriptionExpiresAt) return;
    const daysLeft = Math.ceil((new Date(u.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) {
      u.subscription = "free";
      addNotification(u.id, "subscription_expired", "Subscription Expired", "Your premium plan has expired. Renew to keep premium features.", "/pricing");
      changed = true;
    } else if (daysLeft <= 3 && !u.expiryNotified) {
      addNotification(u.id, "subscription_expiring", "Subscription Expiring", `Your ${u.subscription} plan expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Renew now.`, "/pricing");
      u.expiryNotified = true;
      changed = true;
    }
  });
  if (changed) writeJSON("users.json", users);
}

app.put("/api/admin/users/:id/subscription", adminAuth, (req, res) => {
  const { subscription } = req.body;
  if (!PLANS[subscription]) return res.status(400).json({ error: "Invalid plan" });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  setSubscription(users[idx], subscription);
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
    if (!scores[a.userId]) scores[a.userId] = { correct: 0, total: 0, bySubject: {} };
    scores[a.userId].total++;
    if (a.isCorrect) scores[a.userId].correct++;
  });

  const questionsAll = readJSON("questions.json");
  const papersAll = readJSON("papers.json");
  const subjectsAll = readJSON("subjects.json");

  // dominant subject per student (where they answered most)
  filtered.forEach((a) => {
    const q = questionsAll.find((x) => x.id === a.questionId);
    const p = q ? papersAll.find((x) => x.id === q.paperId) : null;
    if (!p || !scores[a.userId]) return;
    const key = p.subjectId || "?";
    if (!scores[a.userId].bySubject[key]) scores[a.userId].bySubject[key] = 0;
    scores[a.userId].bySubject[key]++;
  });

  const ranked = Object.entries(scores)
    .map(([userId, s]) => {
      const u = users.find((x) => x.id === userId);
      if (!u || u.role === "bot" || u.role === "mod_bot") return null; // hide bots from the leaderboard
      let mainSubject = "?";
      let mainCount = 0;
      Object.entries(s.bySubject).forEach(([sid, n]) => {
        if (n > mainCount) { mainCount = n; mainSubject = subjectsAll.find((x) => x.id === sid)?.name || "?"; }
      });
      return { userId, name: u.name?.trim() || "Anonymous", email: u.email || "", subject: mainSubject, correct: s.correct, total: s.total, percentage: s.total ? Math.round((s.correct / s.total) * 100) : 0 };
    })
    .filter(Boolean)
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
    const payload = verifyAuth(auth.slice(7)); if (!payload) return res.status(401).json({ error: "Invalid token" }); const userId = payload.userId;
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
    const payload = verifyAuth(auth.slice(7)); if (!payload) return res.status(401).json({ error: "Invalid token" }); const userId = payload.userId;
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

  // track bot usage for analytics
  try {
    const stats = readJSON("chat-stats.json");
    stats.push({ botId, botName: bot.name, at: new Date().toISOString() });
    writeJSON("chat-stats.json", stats.slice(-5000));
  } catch {}

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
    const payload = verifyAuth(auth.slice(7)); if (!payload) return res.status(401).json({ error: "Invalid token" }); const userId = payload.userId;
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
    const payload = verifyAuth(auth.slice(7)); if (!payload) return res.status(401).json({ error: "Invalid token" }); const userId = payload.userId;
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
    const payload = verifyAuth(auth.slice(7)); if (!payload) return res.status(401).json({ error: "Invalid token" }); const userId = payload.userId;
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
    const payload = verifyAuth(auth.slice(7)); if (!payload) return res.status(401).json({ error: "Invalid token" }); const userId = payload.userId;
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
    // Team goal reached: notify the whole team when combined correct answers hit the goal
    if (autoCorrect) {
      try {
        const teams = readJSON("teams.json");
        const answersAll = readJSON("answers.json");
        const team = teams.find((t) => t.members.includes(userId));
        if (team && team.goal) {
          const correctCount = answersAll.filter((a) => team.members.includes(a.userId) && a.isCorrect).length;
          if (correctCount >= team.goal) {
            team.members.forEach((mid) => addNotification(mid, "team_goal", "🎯 Team Goal Reached!", `Your team ${team.name} reached ${team.goal} correct answers!`, "/teams"));
          }
        }
      } catch {}
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
    const payload = verifyAuth(auth.slice(7)); if (!payload) return res.status(401).json({ error: "Invalid token" }); const userId = payload.userId;
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
  const now = Date.now();
  const news = readJSON("news.json")
    .filter((n) => !n.scheduledAt || new Date(n.scheduledAt).getTime() <= now)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(news);
});

app.get("/api/admin/news", adminAuth, (req, res) => {
  const news = readJSON("news.json").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(news);
});

app.post("/api/admin/news", adminAuth, (req, res) => {
  const { title, content, category, scheduledAt } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and content required" });
  const news = readJSON("news.json");
  const item = { id: uuidv4(), title, content, category: category || "general", author: req.user.name, scheduledAt: scheduledAt || null, createdAt: new Date().toISOString() };
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

// Public: single quiz result by id (for shareable /view/unknown/result links)
app.get("/api/result/:id", (req, res) => {
  const result = readJSON("quiz-results.json").find((r) => r.id === req.params.id);
  if (!result) return res.status(404).json({ error: "Result not found" });
  const users = readJSON("users.json");
  const u = users.find((x) => x.id === result.userId);
  res.json({ ...result, userName: u?.name || result.userName });
});

// Public: Q&A browse (questions with model answers)
app.get("/api/qa", (req, res) => {
  const { q, subject } = req.query;
  const questions = readJSON("questions.json");
  const papers = readJSON("papers.json");
  const subs = readJSON("subjects.json");
  let list = questions;
  if (q && q.length >= 2) { const query = q.toLowerCase(); list = list.filter((x) => (x.text || "").toLowerCase().includes(query) || (x.modelAnswer || "").toLowerCase().includes(query)); }
  if (subject) { const paperIds = papers.filter((p) => p.subjectId === subject).map((p) => p.id); list = list.filter((x) => paperIds.includes(x.paperId)); }
  const enriched = list.sort(() => Math.random() - 0.5).slice(0, 20).map((x) => {
    const p = papers.find((pp) => pp.id === x.paperId);
    const s = p ? subs.find((ss) => ss.id === p.subjectId) : null;
    return { id: x.id, text: x.text, options: x.options || [], modelAnswer: x.modelAnswer, subject: s?.name, paper: p?.title, grade: p?.grade, marks: x.marks, questionNumber: x.questionNumber };
  });
  res.json(enriched);
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

app.get("/api/admin/security-log", adminAuth, (req, res) => {
  const logs = readJSON("admin-logs.json").filter((l) => l.type === "security").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
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
  const prevLevel = Math.floor(Math.sqrt(record.xp / 100)) + 1;
  const prevBadges = record.badges ? [...record.badges] : [];
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
  // Notify on level-up and new badges
  const level = Math.floor(Math.sqrt(record.xp / 100)) + 1;
  if (level > prevLevel) addNotification(userId, "level_up", "🎉 Level Up!", `You reached Level ${level}!`, "/profile");
  const newBadges = badges.filter((b) => !prevBadges.includes(b));
  newBadges.forEach((b) => addNotification(userId, "badge_earned", "🏅 New Badge", `You earned: ${b}`, "/achievements"));
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
  if (uidx !== -1) { setSubscription(users[uidx], payments[idx].plan); writeJSON("users.json", users); }
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

// ─── AI ENGLISH COMPOSITION GRADING ───────────────────────
app.post("/api/ai-essay", auth, async (req, res) => {
  const { title, essay } = req.body;
  if (!title || !essay || !essay.trim()) return res.status(400).json({ error: "Title and essay are required" });
  if (essay.length > 8000) return res.status(400).json({ error: "Essay too long (max ~1200 words)" });
  const words = essay.trim().split(/\s+/).length;
  const prompt = `Grade this Grade 7 ECZ English composition titled "${title}" (${words} words).
Essay:
---
${essay}
---
As a Zambian ECZ English examiner, grade out of 20 using the ECZ composition rubric: Content/Ideas (7), Structure/Organisation (4), Grammar (5), Spelling & Punctuation (4).
Respond ONLY in this exact format:
Score: X/20
Content: X/7 - one line
Structure: X/4 - one line
Grammar: X/5 - one line
Spelling: X/4 - one line
Feedback: 2-3 sentences on what was good and how to improve.`;
  const result = await askFreeAI([{ role: "user", content: prompt }], 700);
  if (!result.text) return res.status(503).json({ error: "AI temporarily unavailable. Try again in a minute." });
  res.json({ grading: result.text, words, provider: result.provider });
});

// ─── WEEKLY BOSS BATTLE ───────────────────────────────────
function currentWeekKey() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

app.get("/api/boss-battle", auth, (req, res) => {
  const questions = readJSON("questions.json");
  const hard = questions.filter((q) => (q.marks || 1) >= 3);
  const pool = (hard.length >= 10 ? hard : questions).sort(() => Math.random() - 0.5).slice(0, 10);
  const battle = pool.map((q) => ({ id: q.id, text: q.text, options: q.options || [], marks: q.marks || 1 }));
  const results = readJSON("boss-battles.json");
  const week = currentWeekKey();
  const done = results.find((r) => r.userId === req.user.id && r.week === week);
  res.json({ week, battle, alreadyDone: !!done, lastScore: done?.percentage || null });
});

app.post("/api/boss-battle/submit", auth, (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers) || answers.length === 0) return res.status(400).json({ error: "answers array required" });
  const questions = readJSON("questions.json");
  const results = readJSON("boss-battles.json");
  const week = currentWeekKey();
  if (results.find((r) => r.userId === req.user.id && r.week === week)) return res.status(400).json({ error: "You already fought this week's boss" });
  let correct = 0;
  const detail = answers.map((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    if (!q) return { questionId: a.questionId, isCorrect: false };
    const isCorrect = String(a.content || "").toLowerCase().trim() === String(q.modelAnswer || "").toLowerCase().trim();
    if (isCorrect) correct++;
    return { questionId: q.id, text: q.text, isCorrect };
  });
  const total = answers.length;
  const percentage = Math.round((correct / total) * 100);
  results.push({ id: uuidv4(), userId: req.user.id, week, score: correct, total, percentage, detail, createdAt: new Date().toISOString() });
  writeJSON("boss-battles.json", results);
  const xp = Math.round(20 + (percentage / 100) * 80);
  awardXp(req.user.id, xp, `Boss battle: ${correct}/${total}`);
  const badge = percentage >= 80 ? "🐉 Boss Slayer" : percentage >= 50 ? "⚔️ Warrior" : "🛡️ Challenger";
  const xpData = readJSON("xp.json");
  const rec = xpData.find((x) => x.userId === req.user.id);
  if (rec && !rec.badges.includes(badge)) { rec.badges.push(badge); writeJSON("xp.json", xpData); addNotification(req.user.id, "badge_earned", "🏅 New Badge", `You earned: ${badge} in this week's Boss Battle!`, "/achievements"); }
  res.json({ score: correct, total, percentage, xp, badge });
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
  res.json({ students, teachers, bots, papers: papers.length, questions: questions.length, answers: answers.length, storage: storageMode() });
});

app.get("/api/storage-status", (req, res) => {
  res.json({ storage: storageMode(), mongoUrlConfigured: Boolean(process.env.MONGODB_URI || process.env.DATABASE_URL) });
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
  const level = xp ? Math.floor(Math.sqrt(xp.xp / 100)) + 1 : 1;

  // Save a verifiable certificate record
  const certs = readJSON("certificates.json");
  const existing = certs.find((c) => c.userId === req.user.id);
  let cert;
  if (existing) {
    cert = { ...existing, answers: answers.length, correct, pct, level, xp: xp?.xp || 0 };
    certs[certs.indexOf(existing)] = cert;
  } else {
    cert = { id: uuidv4(), userId: req.user.id, name: req.user.name, answers: answers.length, correct, pct, level, xp: xp?.xp || 0, createdAt: new Date().toISOString() };
    certs.push(cert);
    addNotification(req.user.id, "certificate", "🎓 Certificate Earned", "You earned your JohnWeb certificate! Download it from your profile.", "/profile");
  }
  writeJSON("certificates.json", certs);
  const verifyUrl = `https://johnweb-qncu.onrender.com/verify/cert/${cert.id}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`;
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
  .cert .qr { margin-top: 20px; }
  .cert .qr a { color: #15803d; font-size: 13px; }
</style></head><body>
<div class="cert">
  <div style="font-size:20px;color:#d97706;font-weight:bold;">JOHNWEB</div>
  <h1>Certificate of Achievement</h1>
  <p>This certifies that</p>
  <div class="name">${req.user.name}</div>
  <div class="sub">has successfully practiced on the JohnWeb ECZ platform</div>
  <div class="line"></div>
  <div style="font-size:18px;color:#15803d;font-weight:bold;">${answers.length} answers · ${correct} correct · ${pct}% accuracy</div>
  <div style="font-size:16px;color:#475569;margin-top:8px;">Level ${level} · ${xp?.xp || 0} XP</div>
  <div class="date">Awarded on ${new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}</div>
  <div class="qr"><img src="${qr}" alt="Verify this certificate" width="120" height="120" /><br/><a href="${verifyUrl}">Scan to verify: ${verifyUrl}</a></div>
  <div class="footer"><span>Made in Zambia 🇿🇲</span><span>www.johnweb.com</span></div>
</div></body></html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

// Certificate status for the profile page (QR + details, JSON)
app.get("/api/certificate/me", auth, (req, res) => {
  const answers = readJSON("answers.json").filter((a) => a.userId === req.user.id);
  const xp = readJSON("xp.json").find((x) => x.userId === req.user.id);
  const correct = answers.filter((a) => a.isCorrect).length;
  const pct = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const level = xp ? Math.floor(Math.sqrt(xp.xp / 100)) + 1 : 1;
  let cert = readJSON("certificates.json").find((c) => c.userId === req.user.id);
  const verifyUrl = cert?.id ? `https://johnweb-qncu.onrender.com/verify/cert/${cert.id}` : null;
  const qrUrl = cert?.id ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(verifyUrl)}` : null;
  res.json({ earned: !!cert?.id, name: req.user.name, answers: answers.length, correct, pct, level, xp: xp?.xp || 0, verifyUrl, qrUrl, id: cert?.id || null });
});

// Public certificate verification (no auth)
app.get("/api/verify/cert/:id", (req, res) => {
  const certs = readJSON("certificates.json");
  const cert = certs.find((c) => c.id === req.params.id);
  if (!cert) return res.status(404).json({ error: "Certificate not found" });
  const users = readJSON("users.json");
  const u = users.find((x) => x.id === cert.userId);
  res.json({ valid: true, name: cert.name, pct: cert.pct, answers: cert.answers, correct: cert.correct, level: cert.level, xp: cert.xp, issued: cert.createdAt, holder: u ? u.name : cert.name });
});

// ─── CAREER ROADMAP ───────────────────────────────────────
const CAREERS = [
  { id: "nurse", career: "Nurse", subjects: ["Science", "Integrated Science", "English Language"], desc: "Care for the sick in clinics and hospitals. Focus on Science and English.", next: ["Grade 9 Science", "Grade 12 Biology"] },
  { id: "engineer", career: "Engineer", subjects: ["Mathematics", "Additional Mathematics", "Science"], desc: "Design roads, bridges and machines. Mathematics is the key subject.", next: ["Grade 12 Mathematics", "Physics"] },
  { id: "teacher", career: "Teacher", subjects: ["English Language", "Mathematics", "Social Studies"], desc: "Teach learners in schools. Strong English and Mathematics are essential.", next: ["Grade 12 English", "College of Education"] },
  { id: "pilot", career: "Pilot / Airline", subjects: ["Mathematics", "English Language", "Science"], desc: "Fly aircraft. Needs excellent Mathematics, English and Science.", next: ["Grade 12 Mathematics", "Aviation training"] },
  { id: "accountant", career: "Accountant", subjects: ["Mathematics", "English Language", "Principles of Accounts"], desc: "Manage money for businesses. Mathematics and Accounts matter most.", next: ["Grade 12 Accounts", "ZICA"] },
  { id: "police", career: "Police / Security", subjects: ["Social Studies", "English Language", "Civic Education"], desc: "Serve and protect the community. Fitness and Social Studies are key.", next: ["Grade 12 Civic Education", "Police College"] },
  { id: "farmer", career: "Farmer / Agriculture", subjects: ["Science", "Agricultural Science", "Mathematics"], desc: "Grow crops and raise animals. Practical Science and Maths help.", next: ["Grade 12 Agricultural Science"] },
  { id: "programmer", career: "Software Developer", subjects: ["Mathematics", "Computer Studies", "English Language"], desc: "Build apps and websites. Strong Mathematics and Computer Studies lead the way.", next: ["Grade 12 Computer Studies"] },
  { id: "lawyer", career: "Lawyer", subjects: ["English Language", "History", "Civic Education"], desc: "Defend and advise people on the law. Excellent English is essential.", next: ["Grade 12 English", "Law School"] },
  { id: "musician", career: "Musician / Artist", subjects: ["Creative & Technology Studies", "English Language"], desc: "Create music and art. Creative Studies and English develop your talent.", next: ["Grade 12 Creative Studies"] },
];
app.get("/api/careers", (req, res) => res.json(CAREERS));

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
  const pidx = papers.findIndex((p) => p.id === paperId);
  if (pidx >= 0) { papers[pidx].source = "real"; writeJSON("papers.json", papers); }
  adminLog("bulk_import", req.user.id, req.user.name, `${added.length} questions added to ${paperId}`);
  res.json({ added: added.length, questions: added });
});

// Replace a paper's questions with AI-generated ones (realistic Grade 6/7 MCQs)
app.post("/api/admin/generate-paper-questions", adminAuth, async (req, res) => {
  const { paperId, count } = req.body;
  if (!paperId) return res.status(400).json({ error: "paperId required" });
  const papers = readJSON("papers.json");
  const paper = papers.find((p) => p.id === paperId);
  if (!paper) return res.status(404).json({ error: "Paper not found" });
  const subj = readJSON("subjects.json").find((s) => s.id === paper.subjectId);
  const n = Math.min(count || 5, 10);
  const prompt = `Create ${n} multiple-choice questions for an ECZ Grade ${paper.grade} ${subj?.name || "exam"} past paper. They must be age-appropriate for Grade ${paper.grade} Zambian students. Format EXACTLY like this (blank line between questions):\n1. Question text\nA) option\nB) option\nC) option\nD) option\nAnswer: <correct letter>\nMarks: 2`;
  const result = await askFreeAI([{ role: "user", content: prompt }], 1500);
  if (!result.text) return res.status(503).json({ error: "AI generation failed. Try again in a minute." });
  const parsed = parseQuestions(result.text);
  if (parsed.length === 0) return res.status(502).json({ error: "AI returned unparseable output. Try again." });
  let questions = readJSON("questions.json").filter((q) => q.paperId !== paperId);
  parsed.forEach((p, i) => {
    questions.push({ id: uuidv4(), paperId, questionNumber: i + 1, text: p.text, marks: p.marks, modelAnswer: p.answer, type: p.type, options: p.options });
  });
  writeJSON("questions.json", questions);
  const pidx = papers.findIndex((p) => p.id === paperId);
  if (pidx >= 0) { papers[pidx].source = "ai"; writeJSON("papers.json", papers); }
  adminLog("ai_generate", req.user.id, req.user.name, `AI generated ${parsed.length} questions for ${paperId}`);
  res.json({ added: parsed.length, source: "ai" });
});

// ─── PARENT DASHBOARD ─────────────────────────────────────
// A parent links their account to a child using the child's user id as a code.
app.post("/api/parent/link", auth, (req, res) => {
  const { childId } = req.body;
  if (!childId) return res.status(400).json({ error: "childId (code) required" });
  if (childId === req.user.id) return res.status(400).json({ error: "You cannot add yourself" });
  const users = readJSON("users.json");
  const child = users.find((u) => u.id === childId);
  if (!child) return res.status(404).json({ error: "Invalid code. Ask your child to copy their profile link or id." });
  if (!child.parents) child.parents = [];
  if (!child.parents.includes(req.user.id)) child.parents.push(req.user.id);
  if (!req.user.children) req.user.children = [];
  if (!req.user.children.includes(childId)) req.user.children.push(childId);
  writeJSON("users.json", users);
  res.json({ message: "Child linked", child: { id: child.id, name: child.name } });
});

app.get("/api/parent/dashboard", auth, (req, res) => {
  const users = readJSON("users.json");
  const answers = readJSON("answers.json");
  const xpData = readJSON("xp.json");
  const children = (req.user.children || []).map((cid) => {
    const child = users.find((u) => u.id === cid);
    if (!child) return null;
    const ca = answers.filter((a) => a.userId === cid);
    const correct = ca.filter((a) => a.isCorrect).length;
    const xp = xpData.find((x) => x.userId === cid);
    const pct = ca.length ? Math.round((correct / ca.length) * 100) : 0;
    const streak = xp?.streak || 0;
    const readiness = pct >= 80 ? "Ready for the exam" : pct >= 50 ? "Getting there" : "Needs more practice";
    return { id: child.id, name: child.name, answers: ca.length, correct, pct, streak, readiness, xp: xp?.xp || 0 };
  }).filter(Boolean);
  res.json({ children });
});

// ─── SCHOOLS & CLASSES ────────────────────────────────────
function genCode() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }

app.post("/api/classes", auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Class name required" });
  const classes = readJSON("classes.json");
  const cls = { id: uuidv4(), name, teacherId: req.user.id, teacherName: req.user.name, joinCode: genCode(), studentIds: [], assignments: [], createdAt: new Date().toISOString() };
  classes.push(cls);
  writeJSON("classes.json", classes);
  res.json(cls);
});

app.post("/api/classes/join", auth, (req, res) => {
  const { code } = req.body;
  const classes = readJSON("classes.json");
  const cls = classes.find((c) => c.joinCode === (code || "").toUpperCase());
  if (!cls) return res.status(404).json({ error: "Invalid class code" });
  if (cls.studentIds.includes(req.user.id)) return res.json({ message: "Already in class", cls });
  cls.studentIds.push(req.user.id);
  writeJSON("classes.json", classes);
  res.json({ message: "Joined class", cls });
});

app.post("/api/classes/:id/assign", auth, (req, res) => {
  const { paperId, dueDate } = req.body;
  if (!paperId) return res.status(400).json({ error: "paperId required" });
  const classes = readJSON("classes.json");
  const cls = classes.find((c) => c.id === req.params.id);
  if (!cls) return res.status(404).json({ error: "Class not found" });
  if (cls.teacherId !== req.user.id) return res.status(403).json({ error: "Only the teacher can assign" });
  const papers = readJSON("papers.json");
  const p = papers.find((x) => x.id === paperId);
  if (!p) return res.status(404).json({ error: "Paper not found" });
  const asg = { id: uuidv4(), paperId, paperTitle: p.title, dueDate: dueDate || null, createdAt: new Date().toISOString() };
  cls.assignments.push(asg);
  writeJSON("classes.json", classes);
  cls.studentIds.forEach((sid) => addNotification(sid, "assignment", "New Assignment", `${req.user.name} assigned "${p.title}"`, "/classes"));
  res.json(asg);
});

app.get("/api/classes/mine", auth, (req, res) => {
  const classes = readJSON("classes.json");
  const mine = classes.filter((c) => c.teacherId === req.user.id || c.studentIds.includes(req.user.id));
  const users = readJSON("users.json");
  const answers = readJSON("answers.json");
  res.json(mine.map((c) => {
    const isTeacher = c.teacherId === req.user.id;
    const students = c.studentIds.map((sid) => {
      const u = users.find((x) => x.id === sid);
      const sa = answers.filter((a) => a.userId === sid);
      const correct = sa.filter((a) => a.isCorrect).length;
      return { id: sid, name: u?.name || "?", answers: sa.length, correct, pct: sa.length ? Math.round((correct / sa.length) * 100) : 0 };
    });
    return { ...c, isTeacher, students };
  }));
});

// ─── LIVE QUIZ BATTLES ────────────────────────────────────
app.post("/api/battles", auth, (req, res) => {
  const { paperId, count } = req.body;
  const questions = readJSON("questions.json");
  let pool = questions;
  if (paperId) pool = questions.filter((q) => q.paperId === paperId);
  const picked = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(count || 10, 10));
  const battles = readJSON("battles.json");
  const battle = {
    id: uuidv4(), creatorId: req.user.id, creatorName: req.user.name, code: genCode(), status: "open",
    questions: picked.map((q) => ({ id: q.id, text: q.text, options: q.options || [], marks: q.marks || 1 })),
    results: [], createdAt: new Date().toISOString(),
  };
  battles.push(battle);
  writeJSON("battles.json", battles);
  res.json({ id: battle.id, code: battle.code, questions: battle.questions });
});

app.post("/api/battles/join", auth, (req, res) => {
  const { code } = req.body;
  const battles = readJSON("battles.json");
  const battle = battles.find((b) => b.code === (code || "").toUpperCase());
  if (!battle) return res.status(404).json({ error: "Battle not found" });
  if (battle.status !== "open") return res.status(400).json({ error: "Battle already finished" });
  if (battle.creatorId === req.user.id) return res.json({ ...battle, opponentName: battle.creatorName });
  if (battle.results.find((r) => r.userId === req.user.id)) return res.json({ ...battle });
  battle.status = "open";
  writeJSON("battles.json", battles);
  res.json({ id: battle.id, code: battle.code, questions: battle.questions, opponentName: battle.creatorName });
});

app.post("/api/battles/:id/submit", auth, (req, res) => {
  const { answers } = req.body;
  const battles = readJSON("battles.json");
  const battle = battles.find((b) => b.id === req.params.id);
  if (!battle) return res.status(404).json({ error: "Battle not found" });
  const questions = readJSON("questions.json");
  let correct = 0;
  (answers || []).forEach((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    if (q && String(a.content || "").toLowerCase().trim() === String(q.modelAnswer || "").toLowerCase().trim()) correct++;
  });
  const total = battle.questions.length;
  const pct = Math.round((correct / total) * 100);
  const existing = battle.results.findIndex((r) => r.userId === req.user.id);
  if (existing >= 0) battle.results[existing] = { userId: req.user.id, name: req.user.name, correct, pct };
  else battle.results.push({ userId: req.user.id, name: req.user.name, correct, pct });
  // Battle is done when both creator and one challenger have answered, or when creator answers alone
  if (battle.results.length >= 2 || (battle.results.length === 1 && battle.results[0].userId === battle.creatorId && battle.results[0].userId !== req.user.id)) battle.status = "finished";
  else if (battle.results.length === 1 && req.user.id === battle.creatorId && battle.results[0].userId === battle.creatorId) battle.status = "finished";
  writeJSON("battles.json", battles);
  const winner = battle.results.length >= 2 ? (battle.results[0].pct >= battle.results[1].pct ? battle.results[0] : battle.results[1]) : battle.results[0];
  if (battle.status === "finished") awardXp(req.user.id, Math.round(10 + (pct / 100) * 30), `Quiz battle ${correct}/${total}`);
  res.json({ status: battle.status, results: battle.results, winner: battle.status === "finished" ? winner : null });
});


["ratings.json", "notifications.json", "follows.json", "news.json", "contacts.json", "teams.json", "quizzes.json", "quiz-results.json", "notes.json", "comments.json", "admin-logs.json", "xp.json", "password-resets.json", "email-verifications.json", "payments.json", "bookmarks.json", "refresh-tokens.json", "boss-battles.json"].forEach((f) => {
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
    // All super admins / omni super are K200 (top tier) by default
    if ((u.role === "super_admin" || u.role === "omni_super") && u.subscription !== "k200") {
      u.subscription = "k200";
      changed = true;
    }
  });
  if (changed) writeJSON("users.json", users);
}

// ─── INVITE LINKS ─────────────────────────────────────────────
function genToken() { return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10); }

app.post("/api/admin/invites", adminAuth, (req, res) => {
  const { role, school, teacherName, teacherId, maxUses, plan } = req.body;
  const validRoles = ["student", "teacher"];
  const r = validRoles.includes(role) ? role : "student";
  // plan determines the price (e.g. k200 = K200 teacher plan).
  // Teacher invites always get a paid plan (K200 by default).
  let chosenPlan = PLANS[plan] ? plan : null;
  if (r === "teacher" && (!chosenPlan || PLANS[chosenPlan].price === 0)) chosenPlan = "k200";
  const price = chosenPlan ? PLANS[chosenPlan].price : 0;
  const invites = readJSON("invites.json");
  const token = genToken();
  const invite = { id: uuidv4(), token, role: r, plan: chosenPlan, price, paymentStatus: price > 0 ? "unpaid" : "none", phone: null, paymentId: null, registeredUserId: null, school: school || "", teacherName: teacherName || "", teacherId: teacherId || "", maxUses: Math.min(parseInt(maxUses) || 1, 500), usedCount: 0, createdBy: req.user.id, createdAt: new Date().toISOString() };
  invites.push(invite);
  writeJSON("invites.json", invites);
  adminLog("invite_created", req.user.id, req.user.name, `${r} invite (${chosenPlan || "no plan"}, K${price})`);
  res.json(invite);
});

app.get("/api/admin/invites", adminAuth, (req, res) => {
  const invites = readJSON("invites.json").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const users = readJSON("users.json");
  res.json(invites.map((inv) => ({ ...inv, registeredUser: inv.registeredUserId ? users.find((u) => u.id === inv.registeredUserId)?.name || null : null })));
});

app.get("/api/invites/:token", (req, res) => {
  const invite = readJSON("invites.json").find((i) => i.token === req.params.token);
  if (!invite) return res.status(404).json({ error: "Invite not found or expired" });
  if (invite.usedCount >= invite.maxUses) return res.status(400).json({ error: "This invite has reached its limit" });
  res.json({ role: invite.role, plan: invite.plan, price: invite.price, paymentStatus: invite.paymentStatus, school: invite.school, teacherName: invite.teacherName, usedCount: invite.usedCount, maxUses: invite.maxUses });
});

app.post("/api/invites/:token/register", (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).json({ error: "Name and password required" });
  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ error: pwErr });
  const invites = readJSON("invites.json");
  const invite = invites.find((i) => i.token === req.params.token);
  if (!invite) return res.status(404).json({ error: "Invite not found or expired" });
  if (invite.usedCount >= invite.maxUses) return res.status(400).json({ error: "This invite has reached its limit" });
  const users = readJSON("users.json");
  const slug = (name + (invite.school || "jws")).toLowerCase().replace(/[^a-z0-9]+/g, ".");
  let email = `${slug}@invite.johnweb.com`;
  let n = 1;
  while (users.find((u) => u.email === email)) email = `${slug}.${n++}@invite.johnweb.com`;
  // For paid invites: account is created but PENDING (plan locked until admin confirms payment)
  const requiresPayment = invite.price > 0 && invite.paymentStatus !== "paid";
  const user = { id: uuidv4(), name, email, password: bcrypt.hashSync(password, 10), role: invite.role, tokenVersion: 1, school: invite.school || "", teacherName: invite.teacherName || "", teacherId: invite.teacherId || "", subscription: requiresPayment ? "pending" : (invite.plan || undefined), inviteId: invite.id, planLocked: requiresPayment, createdAt: new Date().toISOString() };
  users.push(user);
  writeJSON("users.json", users);
  invite.usedCount++;
  invite.registeredUserId = user.id;
  if (requiresPayment) invite.paymentStatus = invite.paymentStatus === "pending" ? "pending" : "unpaid";
  writeJSON("invites.json", invites);
  res.json({ message: requiresPayment ? "Account created — payment required to activate" : "Registered successfully!", email, requiresPayment, plan: invite.plan, price: invite.price, paymentStatus: invite.paymentStatus, user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, teacherName: user.teacherName } });
});

// Buyer initiates payment (enters Airtel/MTN number) for a paid invite
app.post("/api/invites/:token/pay", (req, res) => {
  const { phone } = req.body;
  const cleanPhone = String(phone || "").replace(/\s+/g, "");
  if (cleanPhone && !/^\d{9,10}$/.test(cleanPhone)) return res.status(400).json({ error: "Enter a valid phone number (e.g. 0971234567)" });
  const invites = readJSON("invites.json");
  const invite = invites.find((i) => i.token === req.params.token);
  if (!invite) return res.status(404).json({ error: "Invite not found" });
  if (!invite.price) return res.status(400).json({ error: "This invite is free — no payment needed" });
  invite.phone = cleanPhone || null;
  invite.paymentStatus = "pending";
  invite.paymentId = uuidv4();
  writeJSON("invites.json", invites);
  const admins = readJSON("users.json").filter((u) => ["super_admin", "omni_super", "admin"].includes(u.role));
  admins.forEach((a) => addNotification(a.id, "invite_payment", "Invite Payment Requested", `K${invite.price} payment${cleanPhone ? ` from ${cleanPhone}` : ""} — confirm in Admin → Invites`, "/admin"));
  res.json({ status: "pending", message: "Payment marked as sent. The admin will confirm and activate your account." });
});

// Buyer checks if payment has been confirmed
app.get("/api/invites/:token/status", (req, res) => {
  const invite = readJSON("invites.json").find((i) => i.token === req.params.token);
  if (!invite) return res.status(404).json({ error: "Invite not found" });
  res.json({ paymentStatus: invite.paymentStatus, plan: invite.plan, price: invite.price, confirmed: invite.paymentStatus === "paid" });
});

// Admin confirms payment → activates the account + plan
app.delete("/api/admin/invites/:id", adminAuth, (req, res) => {
  const invites = readJSON("invites.json");
  const idx = invites.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Invite not found" });
  const [removed] = invites.splice(idx, 1);
  writeJSON("invites.json", invites);
  adminLog("invite_deleted", req.user.id, req.user.name, `Deleted invite ${removed.token}`);
  res.json({ ok: true });
});

app.post("/api/admin/invites/:id/confirm", adminAuth, (req, res) => {
  const invites = readJSON("invites.json");
  const invite = invites.find((i) => i.id === req.params.id);
  if (!invite) return res.status(404).json({ error: "Invite not found" });
  if (!invite.registeredUserId) return res.status(400).json({ error: "No one has registered via this invite yet" });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === invite.registeredUserId);
  if (idx === -1) return res.status(404).json({ error: "Registered user not found" });
  setSubscription(users[idx], invite.plan || "free");
  users[idx].planLocked = false;
  writeJSON("users.json", users);
  invite.paymentStatus = "paid";
  invite.confirmedAt = new Date().toISOString();
  writeJSON("invites.json", invites);
  adminLog("invite_paid", req.user.id, req.user.name, `Confirmed K${invite.price} for ${invite.registeredUserId}`);
  addNotification(invite.registeredUserId, "invite_activated", "Your Account is Active", `Your ${invite.plan} plan is now active!`, "/profile");
  res.json({ ok: true, plan: invite.plan });
});

// ─── REFERRAL PROGRAM ────────────────────────────────────
app.get("/api/referral/status", auth, (req, res) => {
  if (req.user.role !== "student") return res.json({ allowed: false, message: "Referrals are for student accounts only." });
  const referrals = readJSON("referrals.json").filter((r) => r.referrerId === req.user.id);
  res.json({
    allowed: true,
    link: `${req.protocol}://${req.get("host")}/register?ref=${req.user.id}`,
    count: referrals.length,
    program: "Invite 2+ friends — each gets a free week of Student Plus (K50 plan).",
  });
});

// ─── ACCESS CODES (sell codes, students redeem) ─────────────
function genAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) { for (let j = 0; j < 4; j++) s += chars[Math.floor(Math.random() * chars.length)]; if (i < 3) s += "-"; }
  return "JOHN-" + s;
}

app.post("/api/admin/codes", adminAuth, (req, res) => {
  const { plan, count } = req.body;
  const plans = ["k10", "k20", "k30", "k50", "k100"];
  if (!plans.includes(plan)) return res.status(400).json({ error: "Invalid plan" });
  const n = Math.min(count || 1, 100);
  const codes = readJSON("codes.json");
  const created = [];
  for (let i = 0; i < n; i++) {
    let code = genAccessCode();
    while (codes.find((c) => c.code === code)) code = genCode();
    const rec = { id: uuidv4(), code, plan, status: "unused", usedBy: null, usedAt: null, createdAt: new Date().toISOString() };
    codes.push(rec);
    created.push(code);
  }
  writeJSON("codes.json", codes);
  adminLog("codes_generated", req.user.id, req.user.name, `${n} × ${plan} codes`);
  res.json({ created: created.length, codes: created });
});

app.get("/api/admin/codes", adminAuth, (req, res) => {
  res.json(readJSON("codes.json").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

app.post("/api/codes/redeem", (req, res) => {
  const userId = authUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code required" });
  const codes = readJSON("codes.json");
  const rec = codes.find((c) => c.code.toUpperCase() === String(code).toUpperCase().trim());
  if (!rec) return res.status(400).json({ error: "Invalid code" });
  if (rec.status === "used") return res.status(400).json({ error: "This code has already been used" });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  rec.status = "used"; rec.usedBy = userId; rec.usedAt = new Date().toISOString();
  writeJSON("codes.json", codes);
  setSubscription(users[idx], rec.plan);
  writeJSON("users.json", users);
  addNotification(userId, "code_redeemed", "Subscription Activated", `Your ${rec.plan} plan is now active!`, "/profile");
  res.json({ message: `Plan ${rec.plan} activated!`, plan: rec.plan });
});


// ─── OMNI-KEY (master key → omni_super) ────────────────────
function getOmniKey() {
  if (process.env.OMNI_KEY) return process.env.OMNI_KEY;
  const settings = readJSON("settings.json");
  if (settings && settings.omniKey) return settings.omniKey;
  return "";
}

app.post("/api/auth/omni", auth, (req, res) => {
  const { omniKey } = req.body;
  if (!omniKey) return res.status(400).json({ error: "omniKey required" });
  const configured = getOmniKey();
  if (!configured) return res.status(500).json({ error: "OMNI_KEY not configured" });
  if (omniKey !== configured) return res.status(403).json({ error: "Invalid omni key" });
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });
  users[idx].role = "omni_super";
  writeJSON("users.json", users);
  addNotification(req.user.id, "omni_granted", "Omni Access Granted", "You now have omni_super privileges — above all super admins.", "/profile");
  res.json({ message: "Omni access granted", user: { id: users[idx].id, name: users[idx].name, email: users[idx].email, role: "omni_super" } });
});

// ─── TIME-LOCK SEAL (fast to seal, slow to open — proof of work) ──
// Sealing is instant. Opening requires `iterations` SHA-256 rounds (private, slow on purpose).
app.post("/api/seal", auth, (req, res) => {
  const { message, iterations } = req.body;
  if (!message) return res.status(400).json({ error: "message required" });
  const iters = Math.min(Math.max(parseInt(iterations) || 200000, 10000), 5000000);
  const crypto = require("crypto");
  const seed = crypto.createHash("sha256").update(message + Date.now()).digest("hex");
  const seals = readJSON("seals.json");
  const seal = { id: uuidv4(), userId: req.user.id, seed, iterations: iters, createdAt: new Date().toISOString() };
  seals.push(seal);
  writeJSON("seals.json", seals);
  res.json({ id: seal.id, iterations: iters, message: "Sealed instantly. Opening requires proof-of-work (~minutes)." });
});

app.get("/api/seal/:id", auth, (req, res) => {
  const seal = readJSON("seals.json").find((s) => s.id === req.params.id);
  if (!seal) return res.status(404).json({ error: "Seal not found" });
  if (seal.userId !== req.user.id && req.user.role !== "omni_super" && req.user.role !== "super_admin") return res.status(403).json({ error: "Not yours" });
  res.json({ id: seal.id, iterations: seal.iterations, createdAt: seal.createdAt, opened: Boolean(seal.openedAt) });
});

app.post("/api/seal/:id/open", auth, (req, res) => {
  const seals = readJSON("seals.json");
  const seal = seals.find((s) => s.id === req.params.id);
  if (!seal) return res.status(404).json({ error: "Seal not found" });
  if (seal.userId !== req.user.id && req.user.role !== "omni_super" && req.user.role !== "super_admin") return res.status(403).json({ error: "Not yours" });
  const crypto = require("crypto");
  // Deliberately slow proof-of-work: iterate SHA-256 `iterations` times.
  const started = Date.now();
  let h = Buffer.from(seal.seed, "hex");
  for (let i = 0; i < seal.iterations; i++) h = crypto.createHash("sha256").update(h).digest();
  const elapsed = Date.now() - started;
  seal.openedAt = new Date().toISOString();
  seal.openedBy = req.user.id;
  seal.elapsedMs = elapsed;
  writeJSON("seals.json", seals);
  res.json({ opened: true, elapsedMs: elapsed, openedAt: seal.openedAt });
});

// ─── STUDY NOTES BOOK GENERATOR ───────────────────────────
app.get("/api/notes/book", auth, (req, res) => {
  const notes = readJSON("notes.json").filter((n) => n.userId === req.user.id);
  const groups = {};
  notes.forEach((n) => { const key = n.subject || "General"; (groups[key] = groups[key] || []).push(n); });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>My Study Notes Book</title>
<style>body{font-family:Georgia,serif;max-width:700px;margin:auto;padding:40px;color:#1e293b;background:white}
h1{color:#15803d}.subject{margin:0 0 8px;color:#d97706;font-size:22px;border-bottom:2px solid #e5e7eb;padding-bottom:4px}
.note{margin:16px 0;page-break-inside:avoid}.note h3{margin:0 0 4px}.note p{white-space:pre-wrap;color:#374151}
.date{color:#94a3b8;font-size:12px}@media print{.no-print{display:none}}</style></head><body>
<div class="no-print" style="text-align:right"><button onclick="window.print()">🖨️ Print / Save PDF</button></div>
<h1>📖 My Study Notes Book</h1>
<p style="color:#64748b">Created ${new Date().toLocaleDateString()} · ${req.user.name} · ${notes.length} notes</p>
${Object.entries(groups).map(([subject, list]) => `
  <h2 class="subject">${subject}</h2>
  ${list.map((n) => `<div class="note"><h3>${n.title}</h3><p>${n.content.replace(/</g, "&lt;")}</p><div class="date">${new Date(n.updatedAt).toLocaleDateString()}</div></div>`).join("")}
`).join("")}
</body></html>`;
  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", "attachment; filename=johnweb-notes-book.html");
  res.send(html);
});

// ─── ADMIN ANALYTICS ───────────────────────────────────────
app.get("/api/admin/analytics", adminAuth, (req, res) => {
  const users = readJSON("users.json");
  const answers = readJSON("answers.json");
  const papers = readJSON("papers.json");
  const questions = readJSON("questions.json");
  const subs = readJSON("subjects.json");
  const quizResults = readJSON("quiz-results.json");
  const xp = readJSON("xp.json");
  const chatStats = readJSON("chat-stats.json");
  const views = readJSON("paper-views.json");
  const ratings = readJSON("ratings.json");

  const last14 = (map) => Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([date, count]) => ({ date, count }));

  const signups = {};
  users.forEach((u) => { const d = u.createdAt?.slice(0, 10); if (d) signups[d] = (signups[d] || 0) + 1; });

  const answersPerDay = {}, activeUsers = {};
  answers.forEach((a) => {
    const d = a.createdAt?.slice(0, 10); if (!d) return;
    answersPerDay[d] = (answersPerDay[d] || 0) + 1;
    if (!activeUsers[d]) activeUsers[d] = new Set();
    activeUsers[d].add(a.userId);
  });
  const activeCount = {};
  Object.entries(activeUsers).forEach(([d, s]) => { activeCount[d] = s.size; });

  const subjectPerf = {};
  answers.forEach((a) => {
    const q = questions.find((x) => x.id === a.questionId);
    const p = q ? papers.find((x) => x.id === q.paperId) : null;
    const sid = p?.subjectId || "?";
    if (!subjectPerf[sid]) subjectPerf[sid] = { correct: 0, total: 0 };
    subjectPerf[sid].total++; if (a.isCorrect) subjectPerf[sid].correct++;
  });
  const subjectPerformance = Object.entries(subjectPerf).map(([sid, v]) => {
    const s = subs.find((x) => x.id === sid);
    return { subject: s?.name || "?", correct: v.correct, total: v.total, accuracy: v.total ? Math.round((v.correct / v.total) * 100) : 0 };
  }).sort((a, b) => b.total - a.total);

  const usersByPlan = {};
  users.forEach((u) => { const p = u.subscription || "free"; usersByPlan[p] = (usersByPlan[p] || 0) + 1; });

  const avgQuizScore = quizResults.length ? Math.round(quizResults.reduce((s, r) => s + r.percentage, 0) / quizResults.length) : 0;
  const quizTotal = quizResults.length;

  const botUsage = {};
  chatStats.forEach((c) => { botUsage[c.botName] = (botUsage[c.botName] || 0) + 1; });

  const topStreaks = xp.filter((x) => (x.streak || 0) >= 3).sort((a, b) => b.streak - a.streak).slice(0, 5).map((x) => {
    const u = users.find((u) => u.id === x.userId);
    return { name: u?.name || "?", streak: x.streak || 0 };
  });

  const correct = answers.filter((a) => a.isCorrect).length;

  res.json({
    totals: { users: users.length, students: users.filter((u) => u.role === "student").length, answers: answers.length, correct, papers: papers.length, quizzesTaken: quizTotal, ratings: ratings.length, botMessages: chatStats.length },
    signups: last14(signups),
    answersPerDay: last14(answersPerDay),
    activeUsers: last14(activeCount),
    subjectPerformance,
    usersByPlan,
    avgQuizScore,
    topStreaks,
    botUsage,
    topPapers: views.sort((a, b) => b.count - a.count).slice(0, 5).map((v) => {
      const p = papers.find((x) => x.id === v.paperId);
      const s = p ? subs.find((x) => x.id === p.subjectId) : null;
      return { title: p?.title || "?", subject: s?.name, views: v.count };
    }),
  });
});

// ─── FULL DB DOWNLOAD ─────────────────────────────────────
app.get("/api/admin/db", adminAuth, (req, res) => {
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
  const db = {};
  files.forEach((f) => { db[f] = readJSON(f); });
  adminLog("db_downloaded", req.user.id, req.user.name, "Full database exported");
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=johnweb-full-db.json");
  res.send(JSON.stringify(db, null, 2));
});

// ─── #4 PASSWORD RESET COOLDOWN ─────────────────────────────
const resetCooldown = new Map();
app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  const key = String(email).toLowerCase();
  const now = Date.now();
  // 15-minute cooldown per email to prevent reset-token spam
  const last = resetCooldown.get(key);
  if (last && now - last < 15 * 60 * 1000) return res.status(429).json({ message: "A reset link was already sent. Check your email (or wait 15 minutes)." });
  resetCooldown.set(key, now);
  const users = readJSON("users.json");
  const user = users.find((u) => u.email === email);
  const generic = { message: "If that email is registered, a reset link has been sent." };
  if (!user) return res.json(generic);
  const resetToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(now + 30 * 60 * 1000).toISOString(); // 30 min
  const resets = readJSON("password-resets.json");
  resets.forEach((r) => { if (r.userId === user.id && !r.used) r.used = true; });
  resets.push({ id: uuidv4(), userId: user.id, token: resetToken, used: false, expiresAt, createdAt: new Date().toISOString() });
  writeJSON("password-resets.json", resets);
  logSecurity("password_reset_request", user.id, user.email, "Reset token issued (30 min, 15 min cooldown)", req);
  // Token is sent by email only — NEVER returned to the caller
  sendEmail(user.email, "JohnWeb Password Reset", `<p>Use this reset token on the JohnWeb site:</p><p><b>${resetToken}</b></p><p>It expires in 30 minutes.</p>`);
  res.json(generic);
});

// ─── #6 FLAG / MODERATION ───────────────────────────────────
app.post("/api/flag", auth, (req, res) => {
  const { targetType, targetId, reason } = req.body;
  if (!targetType || !targetId) return res.status(400).json({ error: "targetType and targetId required" });
  const flags = readJSON("flags.json");
  const existing = flags.find((f) => f.targetType === targetType && f.targetId === targetId && f.userId === req.user.id);
  if (existing) return res.json({ message: "Already flagged" });
  flags.push({ id: uuidv4(), targetType, targetId, reason: reason || "Inappropriate content", userId: req.user.id, userName: req.user.name, status: "open", createdAt: new Date().toISOString() });
  writeJSON("flags.json", flags);
  const admins = readJSON("users.json").filter((u) => ["super_admin", "omni_super", "admin"].includes(u.role));
  admins.forEach((a) => addNotification(a.id, "content_flagged", "Content Flagged", `${req.user.name} flagged ${targetType} content`, "/admin"));
  res.json({ message: "Flagged for review" });
});

app.get("/api/admin/flags", adminAuth, (req, res) => {
  const flags = readJSON("flags.json").sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(flags);
});

app.post("/api/admin/flags/:id/resolve", adminAuth, (req, res) => {
  const flags = readJSON("flags.json");
  const f = flags.find((x) => x.id === req.params.id);
  if (!f) return res.status(404).json({ error: "Flag not found" });
  f.status = "resolved"; f.resolvedBy = req.user.id; f.resolvedAt = new Date().toISOString();
  writeJSON("flags.json", flags);
  res.json({ ok: true });
});

// ─── #30 SEARCH QUESTIONS BY TOPIC ──────────────────────────
app.get("/api/search-questions", (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  const query = q.toLowerCase();
  const questions = readJSON("questions.json");
  const papers = readJSON("papers.json");
  const subs = readJSON("subjects.json");
  const results = questions.filter((x) => (x.text || "").toLowerCase().includes(query) || (x.modelAnswer || "").toLowerCase().includes(query));
  res.json(results.slice(0, 30).map((x) => {
    const p = papers.find((pp) => pp.id === x.paperId);
    const s = p ? subs.find((ss) => ss.id === p.subjectId) : null;
    return { id: x.id, text: x.text, options: x.options || [], modelAnswer: x.modelAnswer, paperId: x.paperId, paper: p?.title, subject: s?.name, grade: p?.grade, marks: x.marks };
  }));
});

// ─── #36 PAPER VIEW TRACKING ───────────────────────────────
function trackPaperView(paperId) {
  const views = readJSON("paper-views.json");
  const rec = views.find((v) => v.paperId === paperId);
  if (rec) rec.count++;
  else views.push({ paperId, count: 1 });
  writeJSON("paper-views.json", views);
}

app.get("/api/admin/popular-papers", adminAuth, (req, res) => {
  const views = readJSON("paper-views.json").sort((a, b) => b.count - a.count).slice(0, 20);
  const papers = readJSON("papers.json");
  const subs = readJSON("subjects.json");
  res.json(views.map((v) => {
    const p = papers.find((x) => x.id === v.paperId);
    const s = p ? subs.find((x) => x.id === p.subjectId) : null;
    return { paperId: v.paperId, title: p?.title, subject: s?.name, grade: p?.grade, views: v.count };
  }));
});

// ─── #33 BULK EDIT PAPER QUESTIONS ─────────────────────────
app.put("/api/admin/papers/:id/questions", adminAuth, (req, res) => {
  const { questions } = req.body;
  if (!questions || !Array.isArray(questions)) return res.status(400).json({ error: "questions array required" });
  const all = readJSON("questions.json");
  const others = all.filter((q) => q.paperId !== req.params.id);
  questions.forEach((q, i) => {
    others.push({ id: q.id || uuidv4(), paperId: req.params.id, questionNumber: i + 1, text: q.text, marks: parseInt(q.marks) || 2, modelAnswer: q.modelAnswer || "", type: q.options && q.options.length ? "mcq" : "open", options: q.options || [] });
  });
  writeJSON("questions.json", others);
  adminLog("bulk_edit", req.user.id, req.user.name, `${questions.length} questions updated for ${req.params.id}`);
  res.json({ updated: questions.length });
});

// ─── #40 API VERSIONING ────────────────────────────────────
app.use("/api/v1", (req, res, next) => {
  req.url = req.originalUrl.replace(/^\/api\/v1/, "");
  next();
});
// v1 aliases route to the same public handlers
const v1Aliases = ["/subjects", "/papers", "/papers/:id", "/questions", "/quizzes", "/leaderboard", "/stats", "/timetable", "/news"];
v1Aliases.forEach((p) => { app.use(`/api/v1${p}`, (req, res, next) => { req.url = p === "/subjects" ? "/subjects" : req.originalUrl.replace(/^\/api\/v1/, ""); next(); }); });

// ─── #60 GOOGLE SIGN-IN ────────────────────────────────────
app.post("/api/auth/google", async (req, res) => {
  const { idToken, name, email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  const users = readJSON("users.json");
  let user = users.find((u) => u.email === email);
  if (!user) {
    const pw = Math.random().toString(36).slice(2) + "G!" + Date.now();
    user = { id: uuidv4(), name: name || email.split("@")[0], email, password: bcrypt.hashSync(pw, 10), role: "student", tokenVersion: 1, google: true, createdAt: new Date().toISOString() };
    users.push(user);
    writeJSON("users.json", users);
  }
  const tokens = issueTokens(user);
  res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.role, subscription: user.subscription || "free", subscriptionExpiresAt: user.subscriptionExpiresAt || null } });
});

// ─── #61 AVATAR UPLOAD ─────────────────────────────────────
app.post("/api/avatar", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const url = `/uploads/${req.file.filename}`;
  const users = readJSON("users.json");
  const idx = users.findIndex((u) => u.id === req.user.id);
  if (idx >= 0) { users[idx].avatar = url; writeJSON("users.json", users); }
  res.json({ url });
});

// ─── #42 OFFLINE PAPER DOWNLOAD ────────────────────────────
app.get("/api/papers/:id/offline", (req, res) => {
  const papers = readJSON("papers.json");
  const paper = papers.find((p) => p.id === req.params.id);
  if (!paper) return res.status(404).json({ error: "Not found" });
  const subs = readJSON("subjects.json");
  const questions = readJSON("questions.json").filter((q) => q.paperId === paper.id).map((q) => ({ questionNumber: q.questionNumber, text: q.text, options: q.options || [], marks: q.marks }));
  const data = { title: paper.title, subject: subs.find((s) => s.id === paper.subjectId)?.name, grade: paper.grade, year: paper.year, questions };
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename=${paper.id}-offline.json`);
  res.send(JSON.stringify(data, null, 2));
});

// Init empty data files
["ratings.json", "notifications.json", "follows.json", "news.json", "contacts.json", "teams.json", "quizzes.json", "quiz-results.json", "notes.json", "comments.json", "admin-logs.json", "xp.json", "password-resets.json", "email-verifications.json", "payments.json", "bookmarks.json", "refresh-tokens.json", "boss-battles.json", "certificates.json", "classes.json", "battles.json", "codes.json", "invites.json", "referrals.json", "seals.json", "flags.json", "paper-views.json", "chat-stats.json"].forEach((f) => {
  const fp = path.join(DATA_DIR, f);
  if (!fs.existsSync(fp)) fs.writeFileSync(fp, "[]");
});

export default app;
