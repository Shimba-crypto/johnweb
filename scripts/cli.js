#!/usr/bin/env node
// JohnWeb Super-Admin CLI — omnipotent terminal console
// Full-privilege console for managing the JohnWeb app data directly.
// Usage:
//   node scripts/cli.js            # interactive terminal app
//   node scripts/cli.js "command"  # run a single command (non-interactive)
//   node scripts/cli.js help       # show help

import fs from "fs";
import path from "path";
import readline from "node:readline/promises";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const ROOT = path.join(process.cwd());
const DATA_DIR = path.join(ROOT, "data");
const BACKUP_DIR = path.join(ROOT, "backups");

const ROLES = ["student", "investor", "teacher", "dev", "admin", "super_admin", "bot", "mod_bot"];
const PLANS = ["free", "k10", "k20", "k30", "k50", "k100"];

// ─── Terminal colors ───
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  dim: "\x1b[2m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
  underline: "\x1b[4m",
  box: "\x1b[90m",
};
const g = (s) => `${C.green}${s}${C.reset}`;
const dim = (s) => `${C.dim}${s}${C.reset}`;
const y = (s) => `${C.yellow}${s}${C.reset}`;
const r = (s) => `${C.red}${s}${C.reset}`;
const c = (s) => `${C.cyan}${s}${C.reset}`;
const m = (s) => `${C.magenta}${s}${C.reset}`;
const b = (s) => `${C.bold}${s}${C.reset}`;
const boxc = (s) => `${C.box}${s}${C.reset}`;

const BANNER = `
${g("   ██╗ ██████╗ ██╗  ██╗███╗   ██╗██╗    ██╗███████╗██████╗")}
${g("   ██║██╔═══██╗██║  ██║████╗  ██║██║    ██║██╔════╝██╔══██╗")}
${g("   ██║██║   ██║███████║██╔██╗ ██║██║ █╗ ██║█████╗  ██████╔╝")}
${g("██╗██║██║   ██║██╔══██║██║╚██╗██║██║███╗██║██╔══╝  ██╔══██╗")}
${g("╚█╗██║╚██████╔╝██║  ██║██║ ╚████║╚███╔███╔╝███████╗██████╔╝")}
${g(" ╚╝╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══╝╚══╝ ╚══════╝╚═════╝")}
${dim("      Zambian ECZ Super-Admin Console  ·  omnipotent mode")}`;

// ─── UI helpers ───
function box(title, lines) {
  lines = lines.flat(Infinity);
  const lens = lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").length);
  const W = Math.max(title.length, ...lens);
  const top = boxc("┌─ ") + b(title) + boxc("─".repeat(W - title.length) + "┐");
  const bottom = boxc("└" + "─".repeat(W + 3) + "┘");
  const body = lines.map((l) => {
    const n = l.replace(/\x1b\[[0-9;]*m/g, "").length;
    return boxc("│ ") + l + boxc(" ".repeat(W - n) + " │");
  });
  return [top, ...body, bottom].join("\n");
}

function table(headers, rows) {
  const plain = (s) => String(s ?? "").replace(/\x1b\[[0-9;]*m/g, "");
  const cols = headers.map((h, i) => ({
    header: plain(h),
    width: Math.max(plain(h).length, ...rows.map((r) => plain(r[i]).length)),
  }));
  const top = boxc("┌" + cols.map((col) => "─".repeat(col.width + 2)).join("┬") + "┐");
  const sep = boxc("├" + cols.map((col) => "─".repeat(col.width + 2)).join("┼") + "┤");
  const bot = boxc("└" + cols.map((col) => "─".repeat(col.width + 2)).join("┴") + "┘");
  const line = (cells) => boxc("│ ") + cells.map((v, i) => String(v ?? "").replace(/\x1b\[[0-9;]*m/g, "").padEnd(cols[i].width) + boxc(" │ ")).join("");
  const head = boxc("│ ") + headers.map((h, i) => b(cols[i].header).replace(/\x1b\[[0-9;]*m/g, "").padEnd(cols[i].width) + boxc(" │ ")).join("");
  return [top, head, sep, ...rows.map(line), bot].join("\n");
}

function ok(msg) { return g("✔ ") + msg; }
function fail(msg) { return r("✖ ") + msg; }

// ─── Data helpers (JSON files, same format the server uses) ───
function load(file) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return [];
  return JSON.parse(fs.readFileSync(fp, "utf-8"));
}

function loadObj(file, fallback) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return fallback || {};
  try {
    const d = JSON.parse(fs.readFileSync(fp, "utf-8"));
    return (d && typeof d === "object" && !Array.isArray(d)) ? d : (fallback || {});
  } catch { return fallback || {}; }
}

function save(file, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

function findUser(users, ref) {
  return users.find((u) => u.email === ref || u.id === ref);
}

function hashPw(pw) { return bcrypt.hashSync(pw, 10); }

const roleColor = (role) => role === "super_admin" ? y : role === "admin" ? m : role === "dev" ? c : role === "bot" || role === "mod_bot" ? b : g;

// ─── Commands ───
function cmdDash() {
  const users = load("users.json");
  const students = users.filter((u) => u.role === "student").length;
  const superAdmins = users.filter((u) => u.role === "super_admin").length;
  const teachers = users.filter((u) => ["teacher", "dev", "admin"].includes(u.role)).length;
  const bots = users.filter((u) => u.role === "bot" || u.role === "mod_bot").length;
  const answers = load("answers.json");
  const correct = answers.filter((a) => a.isCorrect).length;
  const pending = answers.filter((a) => a.reviewStatus === "pending").length;
  const payments = load("payments.json");
  const revenue = payments.filter((p) => p.status === "completed").reduce((s, p) => s + (p.amount || 0), 0);
  const w = (label, val, extra = "") => `${g(label.padEnd(13))}${b(String(val))}  ${dim(extra)}`;
  return box("JOHNWEB DASHBOARD", [
    `  ${w("users", users.length, `students ${students} · teachers ${teachers} · bots ${bots}`)}`,
    `  ${w("super_admins", superAdmins)}`,
    `  ${w("subjects", load("subjects.json").length)}`,
    `  ${w("papers", load("papers.json").length)}`,
    `  ${w("questions", load("questions.json").length)}`,
    `  ${w("answers", answers.length, `${correct} correct · ${pending} pending review`)}`,
    `  ${w("quizzes", load("quizzes.json").length)}`,
    `  ${w("payments", payments.length, `revenue K${revenue}`)}`,
    `  ${w("news", load("news.json").length)}`,
  ]);
}

function cmdUsers() {
  const users = load("users.json");
  if (!users.length) return fail("No users yet.");
  const rows = users.map((u) => [
    roleColor(u.role)(u.role),
    u.email,
    u.name || "",
    u.subscription || "—",
  ]);
  return box(`USERS (${users.length})`, [table([b("ROLE"), b("EMAIL"), b("NAME"), b("PLAN")], rows).split("\n")]);
}

function cmdUser(ref) {
  const users = load("users.json");
  const u = findUser(users, ref);
  if (!u) return fail(`User not found: ${ref}`);
  const lines = [
    `  ${g("name")}   ${b(u.name || "")}`,
    `  ${g("email")}  ${u.email}`,
    `  ${g("role")}   ${roleColor(u.role)(u.role)}`,
    `  ${g("plan")}   ${u.subscription || "free"}`,
    `  ${g("id")}     ${dim(u.id)}`,
    `  ${g("since")}  ${dim((u.createdAt || "").slice(0, 10))}`,
  ];
  if (u.apiKeyHash) lines.push(`  ${g("bot key")}  ${dim("hashed (key hidden)")}`);
  if (u.systemPrompt) lines.push(`  ${g("prompt")}  ${dim(String(u.systemPrompt).slice(0, 60))}`);
  return box("USER", lines);
}

function cmdMkUser(args) {
  if (args.length < 3) return fail('Usage: mkuser <name> <email> <pass> [role]  (quote multi-word names)');
  let role = "student";
  let email, pw, name;
  if (args.length >= 4 && ROLES.includes(args[args.length - 1])) {
    role = args[args.length - 1];
    email = args[args.length - 3];
    pw = args[args.length - 2];
    name = args.slice(0, args.length - 3).join(" ");
  } else {
    email = args[args.length - 2];
    pw = args[args.length - 1];
    name = args.slice(0, args.length - 2).join(" ");
  }
  if (!name || !email || !pw) return fail("Usage: mkuser <name> <email> <pass> [role]");
  const users = load("users.json");
  if (users.find((u) => u.email === email)) return fail(`Email already registered: ${email}`);
  const user = { id: uuidv4(), name, email, password: hashPw(pw), role, createdAt: new Date().toISOString() };
  users.push(user);
  save("users.json", users);
  return ok(`Created ${roleColor(role)(role)}: ${email}`);
}

function cmdRole(ref, role) {
  if (!ROLES.includes(role)) return fail(`Invalid role. Valid: ${ROLES.join(", ")}`);
  const users = load("users.json");
  const u = findUser(users, ref);
  if (!u) return fail(`User not found: ${ref}`);
  u.role = role;
  save("users.json", users);
  return ok(`${u.email} is now ${roleColor(role)(role)}`);
}

function cmdMkAdmin(ref) { return cmdRole(ref, "super_admin"); }

function cmdPass(ref, pw) {
  if (!pw) return fail("Usage: pass <email> <newpass>");
  const users = load("users.json");
  const u = findUser(users, ref);
  if (!u) return fail(`User not found: ${ref}`);
  u.password = hashPw(pw);
  save("users.json", users);
  return ok(`Password updated for ${u.email}`);
}

function cmdSub(ref, plan) {
  if (!PLANS.includes(plan)) return fail(`Invalid plan. Valid: ${PLANS.join(", ")}`);
  const users = load("users.json");
  const u = findUser(users, ref);
  if (!u) return fail(`User not found: ${ref}`);
  u.subscription = plan;
  save("users.json", users);
  return ok(`${u.email} subscription set to ${y(plan)}`);
}

function cmdDel(ref) {
  const users = load("users.json");
  const idx = users.findIndex((u) => u.email === ref || u.id === ref);
  if (idx === -1) return fail(`User not found: ${ref}`);
  const [removed] = users.splice(idx, 1);
  save("users.json", users);
  return ok(`Deleted ${removed.name} (${removed.email})`);
}

function cmdNotify(ref, title, msg) {
  if (!title || !msg) return fail("Usage: notify <email> <title> <message>");
  const users = load("users.json");
  const u = findUser(users, ref);
  if (!u) return fail(`User not found: ${ref}`);
  const notifs = load("notifications.json");
  notifs.push({ id: uuidv4(), userId: u.id, type: "admin_message", title, message: msg, link: "/profile", read: false, createdAt: new Date().toISOString() });
  save("notifications.json", notifs);
  return ok(`Notification sent to ${u.email}`);
}

function cmdBots() {
  const users = load("users.json").filter((u) => u.role === "bot" || u.role === "mod_bot");
  if (!users.length) return fail("No bots yet.");
  const rows = users.map((u) => [c(u.role), b(u.name), (u.subjects || []).join(", ") || "—", u.apiKeyHash ? dim("locked") : dim("—")]);
  return box(`BOTS (${users.length})`, [table([b("ROLE"), b("NAME"), b("SUBJECTS"), b("KEY")], rows).split("\n")]);
}

function cmdBot(name, subjectsCsv) {
  if (!name) return fail('Usage: bot <name> <subjects>  (e.g. bot Zaza "Mathematics, Science")');
  const users = load("users.json");
  if (users.find((u) => u.name === name)) return fail(`Bot with that name already exists: ${name}`);
  const botId = uuidv4();
  const apiKey = `johnbot-${botId}-${Date.now().toString(36)}`;
  const bot = {
    id: botId, name, email: `bot-${botId}@johnweb.com`, password: hashPw(apiKey), role: "bot",
    subjects: (subjectsCsv || "").split(",").map((s) => s.trim()).filter(Boolean),
    description: "", systemPrompt: "", apiKeyHash: hashPw(apiKey), createdAt: new Date().toISOString(),
  };
  users.push(bot);
  save("users.json", users);
  return box("BOT CREATED", [`  ${ok(name)}`, `  ${y("API key (shown once):")}`, `  ${c(apiKey)}`]);
}

function cmdBotKey(name) {
  const users = load("users.json");
  const bot = users.find((u) => (u.role === "bot" || u.role === "mod_bot") && u.name === name);
  if (!bot) return fail(`Bot not found: ${name}`);
  const apiKey = `${bot.role === "mod_bot" ? "modbot" : "johnbot"}-${bot.id}-${Date.now().toString(36)}`;
  bot.apiKeyHash = hashPw(apiKey);
  delete bot.apiKey;
  save("users.json", users);
  return box("NEW API KEY", [`  ${ok(name)}`, `  ${y("SAVE THIS — shown once:")}`, `  ${c(apiKey)}`]);
}

function cmdSubjects() {
  const subjects = load("subjects.json");
  if (!subjects.length) return fail("No subjects yet.");
  const rows = subjects.map((s) => [g(s.code || "—"), s.name, dim((s.description || "").slice(0, 30))]);
  return box(`SUBJECTS (${subjects.length})`, [table([b("CODE"), b("NAME"), b("DESCRIPTION")], rows).split("\n")]);
}

function cmdAddSubject(name, code, desc = "") {
  if (!name || !code) return fail("Usage: addsub <name> <code> [description]");
  const subjects = load("subjects.json");
  if (subjects.find((s) => s.name.toLowerCase() === name.toLowerCase())) return fail(`Subject already exists: ${name}`);
  const sub = { id: `sub-${uuidv4()}`, name, code, description: desc };
  subjects.push(sub);
  save("subjects.json", subjects);
  return ok(`Added subject: ${name} (${code})`);
}

function cmdPapers(subjectId) {
  const papers = load("papers.json");
  const subjects = load("subjects.json");
  const filtered = subjectId ? papers.filter((p) => p.subjectId === subjectId) : papers;
  if (!filtered.length) return fail("No papers found.");
  const rows = filtered.slice(0, 60).map((p) => {
    const s = subjects.find((x) => x.id === p.subjectId);
    return [dim(p.id), `G${p.grade}`, p.year, g(s?.name || "?"), p.title.slice(0, 34)];
  });
  return box(`PAPERS (${filtered.length}${filtered.length > 60 ? ", showing 60" : ""})`, [table([b("ID"), b("GR"), b("YEAR"), b("SUBJECT"), b("TITLE")], rows).split("\n")]);
}

function cmdNews() {
  const news = load("news.json");
  if (!news.length) return fail("No news yet.");
  const rows = news.slice(0, 30).map((n) => [dim((n.createdAt || "").slice(0, 10)), n.category || "general", b(n.title), dim(n.author || "")]);
  return box(`NEWS (${news.length})`, [table([b("DATE"), b("CATEGORY"), b("TITLE"), b("AUTHOR")], rows).split("\n")]);
}

function cmdQuizzes() {
  const quizzes = load("quizzes.json");
  if (!quizzes.length) return fail("No quizzes yet.");
  const rows = quizzes.map((q) => [dim(q.id), b(q.title), q.subject || "—", q.grade || "—", q.questions?.length || 0]);
  return box(`QUIZZES (${quizzes.length})`, [table([b("ID"), b("TITLE"), b("SUBJECT"), b("GR"), b("Q")], rows).split("\n")]);
}

function cmdSettings() {
  const s = loadObj("settings.json", {});
  const keys = Object.keys(s).filter((k) => k !== "jwtSecret");
  if (!keys.length) return fail("(no settings yet)");
  const rows = keys.map((k) => [g(k), s[k]]);
  return box("SETTINGS", [table([b("KEY"), b("VALUE")], rows).split("\n")]);
}

function cmdSet(key, value) {
  if (!key || value === undefined) return fail("Usage: set <key> <value>");
  const s = loadObj("settings.json", {});
  s[key] = value;
  save("settings.json", s);
  return ok(`set ${g(key)} = ${value}`);
}

function cmdStats() {
  const count = (f) => load(f).length;
  const lines = [
    `  ${g("subjects")}   ${count("subjects.json")}`,
    `  ${g("papers")}     ${count("papers.json")}`,
    `  ${g("questions")}  ${count("questions.json")}`,
    `  ${g("users")}      ${count("users.json")}`,
    `  ${g("answers")}    ${count("answers.json")}`,
    `  ${g("quizzes")}    ${count("quizzes.json")}`,
    `  ${g("comments")}   ${count("comments.json")}`,
    `  ${g("payments")}   ${count("payments.json")}`,
    `  ${g("news")}       ${count("news.json")}`,
  ];
  return box("STATS", lines);
}

function cmdBackup() {
  if (!fs.existsSync(DATA_DIR)) return fail("No data directory.");
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const filename = `johnweb-cli-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const data = {};
  fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json")).forEach((f) => {
    data[f] = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf-8"));
  });
  fs.writeFileSync(path.join(BACKUP_DIR, filename), JSON.stringify(data, null, 2));
  return ok(`Backup written to ${c(`backups/${filename}`)}`);
}

function cmdMenu() {
  return box("MENU — press a number", [
    `  ${c("1")}  Dashboard`,
    `  ${c("2")}  Users`,
    `  ${c("3")}  Create user`,
    `  ${c("4")}  Make super admin`,
    `  ${c("5")}  Bots`,
    `  ${c("6")}  Subjects`,
    `  ${c("7")}  Papers`,
    `  ${c("8")}  News`,
    `  ${c("9")}  Quizzes`,
    `  ${c("10")} Settings`,
    `  ${c("11")} Stats`,
    `  ${c("12")} Backup`,
    `  ${c("13")} Help`,
    `  ${c("0")}  Exit`,
  ]);
}

// ─── Dispatcher ───
function tokenize(line) {
  const tokens = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (/\s/.test(ch)) { if (cur) { tokens.push(cur); cur = ""; } }
    else cur += ch;
  }
  if (cur) tokens.push(cur);
  return tokens;
}

async function run(line, rl) {
  const [cmd, ...args] = tokenize(line);
  if (!cmd) return "";

  switch (cmd) {
    case "help": case "?": case "commands": return cmdMenu();
    case "exit": case "quit": case "q": return "__EXIT__";
    case "menu": case "m": return cmdMenu();
    case "dash": case "dashboard": return cmdDash();
    case "users": case "ls": case "list": return cmdUsers();
    case "user": return cmdUser(args[0]);
    case "mkuser": case "adduser": return cmdMkUser(args);
    case "role": case "setrole": return cmdRole(args[0], args[1]);
    case "mkadmin": case "omni": return cmdMkAdmin(args[0]);
    case "pass": case "password": case "chpass": return cmdPass(args[0], args[1]);
    case "sub": case "subscription": case "plan": return cmdSub(args[0], args[1]);
    case "del": case "delete": case "rm": return cmdDel(args[0]);
    case "notify": case "msg": return cmdNotify(args[0], args[1], args.slice(2).join(" "));
    case "bots": case "botlist": return cmdBots();
    case "bot": case "mkbot": return cmdBot(args[0], args.slice(1).join(" "));
    case "botkey": case "resetkey": return cmdBotKey(args[0]);
    case "subjects": case "subjectlist": return cmdSubjects();
    case "addsub": case "subject": return cmdAddSubject(args[0], args[1], args.slice(2).join(" "));
    case "papers": case "paperlist": return cmdPapers(args[0]);
    case "news": return cmdNews();
    case "quizzes": return cmdQuizzes();
    case "settings": return cmdSettings();
    case "set": return cmdSet(args[0], args[1]);
    case "stats": return cmdStats();
    case "backup": return cmdBackup();
    case "clear": return "\x1b[2J\x1b[0;0H";
    default:
      // numeric menu selection
      if (/^\d+$/.test(cmd) && rl) return menuAction(parseInt(cmd), rl);
      return fail(`Unknown command: ${cmd}  (type ${g("menu")} for options)`);
  }
}

// Numeric menu actions (interactive — asks for missing values)
async function menuAction(num, rl) {
  const ask = async (q) => {
    const ans = await rl.question(g("  ") + q + ": ");
    return ans.trim();
  };
  switch (num) {
    case 1: return cmdDash();
    case 2: return cmdUsers();
    case 3: {
      const name = await ask("name"); const email = await ask("email"); const pw = await ask("password"); const role = (await ask(`role [${ROLES.join("/")}]`)) || "student";
      return cmdMkUser([name, email, pw, role]);
    }
    case 4: {
      const email = await ask("email to make super admin");
      return cmdMkAdmin(email);
    }
    case 5: return cmdBots();
    case 6: return cmdSubjects();
    case 7: {
      const id = await ask("subjectId (enter to show all)");
      return cmdPapers(id || undefined);
    }
    case 8: return cmdNews();
    case 9: return cmdQuizzes();
    case 10: return cmdSettings();
    case 11: return cmdStats();
    case 12: return cmdBackup();
    case 13: return cmdMenu();
    case 0: return "__EXIT__";
    default: return fail(`No menu item ${num}`);
  }
}

// ─── Entry ───
const single = process.argv.slice(2).join(" ");
if (single) {
  const out = await run(single, null);
  if (out === "__EXIT__") process.exit(0);
  if (out) console.log(out.replace(/\x1b\[[0-9;]*m/g, ""));
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, historySize: 50 });
console.log(BANNER);
console.log(box("OMNIPOTENT CONSOLE", [
  `  ${c("menu")}   interactive menu      ${c("help")}   command list`,
  `  ${c("users")}  list users            ${c("mkadmin")} <email>   make super admin`,
  `  ${c("dash")}   dashboard overview    ${c("backup")}  full data backup`,
  `  Type a number to pick a menu item.  ${c("exit")} to quit.`,
]));
console.log();
while (true) {
  const line = await rl.question(g("johnweb") + y("➜ ") + C.reset);
  if (line === null) break;
  if (line.trim()) {
    const out = await run(line, rl);
    if (out === "__EXIT__") break;
    if (out) { console.log(out); console.log(); }
  }
}
rl.close();
console.log(dim("Goodbye. JohnWeb is still running. 👋"));
