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
  bold: "\x1b[1m",
};
const g = (s) => `${C.green}${s}${C.reset}`;
const dim = (s) => `${C.dim}${s}${C.reset}`;
const y = (s) => `${C.yellow}${s}${C.reset}`;
const r = (s) => `${C.red}${s}${C.reset}`;
const c = (s) => `${C.cyan}${s}${C.reset}`;
const b = (s) => `${C.bold}${s}${C.reset}`;

const BANNER = `
${g("   ██╗ ██████╗ ██╗  ██╗███╗   ██╗██╗    ██╗███████╗██████╗")}
${g("   ██║██╔═══██╗██║  ██║████╗  ██║██║    ██║██╔════╝██╔══██╗")}
${g("   ██║██║   ██║███████║██╔██╗ ██║██║ █╗ ██║█████╗  ██████╔╝")}
${g("██╗██║██║   ██║██╔══██║██║╚██╗██║██║███╗██║██╔══╝  ██╔══██╗")}
${g("╚█╗██║╚██████╔╝██║  ██║██║ ╚████║╚███╔███╔╝███████╗██████╔╝")}
${g(" ╚╝╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══╝╚══╝ ╚══════╝╚═════╝")}
${dim("   Zambian ECZ Super-Admin Console  ·  omnipotent mode")}`;

const HELP = `JohnWeb Super-Admin CLI — commands
${b("Users")}
  ${g("users")}                              list all users
  ${g("user <email>")}                       show one user
  ${g("mkuser <name> <email> <pass> [role]")}   create a user (default role: student)
  ${g("role <email> <role>")}                change role (${ROLES.join(", ")})
  ${g("mkadmin <email>")}                    make someone a super_admin
  ${g("pass <email> <newpass>")}             set password
  ${g("sub <email> <plan>")}                 set subscription (${PLANS.join(", ")})
  ${g("del <email>")}                        delete a user
  ${g("notify <email> <title> <msg>")}       send a notification
${b("Bots")}
  ${g("bots")}                               list bots
  ${g("bot <name> <subjects>")}              create a bot (prints API key once)
  ${g("botkey <name>")}                      reset a bot's API key (prints once)
${b("Content")}
  ${g("subjects")}                           list subjects
  ${g("addsub <name> <code> [desc]")}        add a subject
  ${g("papers [subjectId]")}                 list papers
  ${g("news")}                               list news items
  ${g("quizzes")}                            list quizzes
  ${g("settings")}                           show settings
  ${g("set <key> <value>")}                  set a setting (e.g. deepseekApiKey, openrouterApiKey)
${b("System")}
  ${g("dash")} / ${g("menu")}                dashboard overview
  ${g("stats")}                              counts across the app
  ${g("backup")}                             write a full data backup to /backups
  ${g("help")}                               this help
  ${g("exit")} / ${g("quit")}                leave the CLI
${dim("Tip: use quotes for multi-word values, e.g. mkuser \"John Doe\" john@example.com pass")}$`;

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

function hashPw(pw) {
  return bcrypt.hashSync(pw, 10);
}

function ok(msg) { return g(`✔ ${msg}`); }
function fail(msg) { return r(`✖ ${msg}`); }

// ─── Commands ───
function cmdUsers() {
  const users = load("users.json");
  if (!users.length) return fail("No users yet.");
  const rows = users.map((u) => {
    const roleColor = u.role === "super_admin" ? y : (u.role === "admin" ? c : g);
    return `${roleColor(u.role.padEnd(12))} ${u.email.padEnd(34)} ${u.name || ""}`;
  }).join("\n");
  return `${dim(`(${users.length} users)`)}\n${rows}`;
}

function cmdUser(ref) {
  const users = load("users.json");
  const u = findUser(users, ref);
  if (!u) return fail(`User not found: ${ref}`);
  return JSON.stringify(u, null, 2);
}

function cmdMkUser(args) {
  if (args.length < 3) return fail("Usage: mkuser <name> <email> <pass> [role]  (quote multi-word names)");
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
  return ok(`Created ${role}: ${email}`);
}

function cmdRole(ref, role) {
  if (!ROLES.includes(role)) return fail(`Invalid role. Valid: ${ROLES.join(", ")}`);
  const users = load("users.json");
  const u = findUser(users, ref);
  if (!u) return fail(`User not found: ${ref}`);
  u.role = role;
  save("users.json", users);
  return ok(`${u.email} is now ${role}`);
}

function cmdMkAdmin(ref) {
  return cmdRole(ref, "super_admin");
}

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
  return ok(`${u.email} subscription set to ${plan}`);
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
  return users.map((u) => `${c(u.role.padEnd(8))} ${b(u.name.padEnd(20))} subjects: ${(u.subjects || []).join(", ") || "-"}`).join("\n");
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
  return ok(`Bot created: ${name}\n${y("API key (SAVE THIS — shown once):")}\n  ${apiKey}`);
}

function cmdBotKey(name) {
  const users = load("users.json");
  const bot = users.find((u) => (u.role === "bot" || u.role === "mod_bot") && u.name === name);
  if (!bot) return fail(`Bot not found: ${name}`);
  const apiKey = `${bot.role === "mod_bot" ? "modbot" : "johnbot"}-${bot.id}-${Date.now().toString(36)}`;
  bot.apiKeyHash = hashPw(apiKey);
  delete bot.apiKey;
  save("users.json", users);
  return ok(`New API key for ${name}\n${y("SAVE THIS — shown once:")}\n  ${apiKey}`);
}

function cmdSubjects() {
  const subjects = load("subjects.json");
  if (!subjects.length) return fail("No subjects yet.");
  return subjects.map((s) => `${g((s.code || "-").padEnd(8))} ${s.name}`).join("\n");
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
  return filtered.map((p) => {
    const s = subjects.find((x) => x.id === p.subjectId);
    return `${dim(p.id.padEnd(12))} G${p.grade} ${p.year} ${g(s?.name || "?")} - ${p.title}`;
  }).join("\n");
}

function cmdNews() {
  const news = load("news.json");
  if (!news.length) return fail("No news yet.");
  return news.map((n) => `${dim(n.id.padEnd(12))} ${n.createdAt?.slice(0, 10)} ${b(n.title)}`).join("\n");
}

function cmdQuizzes() {
  const quizzes = load("quizzes.json");
  if (!quizzes.length) return fail("No quizzes yet.");
  return quizzes.map((q) => `${dim(q.id.padEnd(12))} ${q.title} ${dim(`(${q.questions?.length || 0} questions)`)}`).join("\n");
}

function cmdSettings() {
  const s = loadObj("settings.json", {});
  const keys = Object.keys(s);
  if (!keys.length) return fail("(no settings yet)");
  return keys.map((k) => `${g(k)} = ${s[k]}`).join("\n");
}

function cmdSet(key, value) {
  if (!key || value === undefined) return fail("Usage: set <key> <value>");
  const s = loadObj("settings.json", {});
  s[key] = value;
  save("settings.json", s);
  return ok(`set ${key} = ${value}`);
}

function cmdStats() {
  const count = (f) => load(f).length;
  return [
    `${g("subjects")}   ${count("subjects.json")}`,
    `${g("papers")}     ${count("papers.json")}`,
    `${g("questions")}  ${count("questions.json")}`,
    `${g("users")}      ${count("users.json")}`,
    `${g("answers")}    ${count("answers.json")}`,
    `${g("quizzes")}    ${count("quizzes.json")}`,
    `${g("comments")}   ${count("comments.json")}`,
    `${g("payments")}   ${count("payments.json")}`,
    `${g("news")}       ${count("news.json")}`,
  ].join("\n");
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
  return ok(`Backup written to backups/${filename}`);
}

function cmdDash() {
  const users = load("users.json");
  const students = users.filter((u) => u.role === "student").length;
  const superAdmins = users.filter((u) => u.role === "super_admin").length;
  const answers = load("answers.json");
  const correct = answers.filter((a) => a.isCorrect).length;
  const pending = answers.filter((a) => a.reviewStatus === "pending").length;
  const lines = [
    "",
    `${b("JOHNWEB DASHBOARD")}`,
    `${g("users:")}       ${users.length}   ${dim(`(students ${students} · super_admins ${superAdmins})`)}`,
    `${g("subjects:")}    ${load("subjects.json").length}`,
    `${g("papers:")}      ${load("papers.json").length}`,
    `${g("questions:")}   ${load("questions.json").length}`,
    `${g("answers:")}     ${answers.length}   ${dim(`(${correct} correct · ${pending} pending review)`)}`,
    `${g("quizzes:")}     ${load("quizzes.json").length}`,
    `${g("payments:")}    ${load("payments.json").length}`,
    `${g("news:")}        ${load("news.json").length}`,
    "",
  ];
  return lines.join("\n");
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

async function run(line) {
  const [cmd, ...args] = tokenize(line);
  if (!cmd) return "";

  switch (cmd) {
    case "help": case "?": case "commands": return HELP;
    case "exit": case "quit": case "q": return "__EXIT__";
    case "dash": case "menu": case "dashboard": return cmdDash();
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
    default: return fail(`Unknown command: ${cmd}  (try: help)`);
  }
}

// ─── Entry ───
const single = process.argv.slice(2).join(" ");
if (single) {
  const out = await run(single);
  if (out === "__EXIT__") process.exit(0);
  if (out) console.log(out.replace(/\x1b\[[0-9;]*m/g, ""));
  process.exit(0);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log(BANNER);
console.log(`${dim("  omnipotent console — type ")}${c("help")}${dim(" for commands, ")}${c("exit")}${dim(" to quit")}`);
console.log();
while (true) {
  const line = await rl.question(g("johnweb") + y("➜ ") + C.reset);
  if (line === null) break;
  if (line.trim()) {
    const out = await run(line);
    if (out === "__EXIT__") break;
    if (out) console.log(out);
    console.log();
  }
}
rl.close();
console.log(dim("Goodbye. JohnWeb is still running. 👋"));
