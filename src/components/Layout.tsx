import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";

export default function Layout() {
  const [user, setUser] = useState<any>(null);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [open, setOpen] = useState(false);
  const [streak, setStreak] = useState<{ streak: number; activeToday: boolean } | null>(null);
  const location = useLocation();

  useEffect(() => { document.documentElement.setAttribute("data-theme", dark ? "dark" : "light"); localStorage.setItem("theme", dark ? "dark" : "light"); }, [dark]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    try { setUser(stored ? JSON.parse(stored) : null); } catch { setUser(null); }
    const check = () => { const u = localStorage.getItem("user"); try { setUser(u ? JSON.parse(u) : null); } catch { setUser(null); } };
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, [location.pathname]);

  // Refresh role from the server so role changes (e.g. promoted to admin) take effect
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return;
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.error || !d.id) return;
        const old = localStorage.getItem("user");
        try {
          const prev = old ? JSON.parse(old) : {};
          if (prev.role !== d.role || prev.name !== d.name) {
            const updated = { ...prev, ...d };
            localStorage.setItem("user", JSON.stringify(updated));
            setUser(updated);
          }
        } catch {}
      })
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t || !u) { setStreak(null); return; }
    let uid: string | null = null;
    try { uid = JSON.parse(u).id; } catch {}
    if (!uid) return;
    fetch(`/api/gamification/${uid}`).then((r) => r.json()).then((d) => {
      if (cancelled) return;
      const activeToday = d.lastActivity ? new Date(d.lastActivity).toDateString() === new Date().toDateString() : false;
      setStreak({ streak: d.streak || 0, activeToday });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [location.pathname, user]);

  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("refreshToken"); localStorage.removeItem("user"); setUser(null); window.location.href = "/"; };

  const switchAccount = (session: any) => {
    localStorage.setItem("token", session.token);
    localStorage.setItem("refreshToken", session.refreshToken || "");
    localStorage.setItem("user", JSON.stringify(session.user));
    window.location.href = "/";
  };

  const removeSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const sessions = JSON.parse(localStorage.getItem("jwSessions") || "[]").filter((s: any) => s.user.id !== id);
      localStorage.setItem("jwSessions", JSON.stringify(sessions));
      window.location.reload();
    } catch {}
  };

  const savedSessions = (() => {
    try { return JSON.parse(localStorage.getItem("jwSessions") || "[]"); } catch { return []; }
  })();

  const linkCls = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${location.pathname === path ? "bg-green-600 text-white font-medium" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`;

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{children}</div>
  );

  const roleLink = () => {
    if (!user) return null;
    if (user.role === "omni_super" || user.role === "super_admin" || user.role === "admin") return <Link to="/admin" className={linkCls("/admin")}>🛠️ <span>Admin Panel</span></Link>;
    if (user.role === "teacher") return <Link to="/teacher" className={linkCls("/teacher")}>📝 <span>Grade Answers</span></Link>;
    if (user.role === "investor") return <Link to="/investor" className={linkCls("/investor")}>📊 <span>Analytics</span></Link>;
    return null;
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold"><span className="text-green-600">John</span><span className="text-orange-500">Web</span></span>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <SectionLabel>Study</SectionLabel>
        <Link to="/browse" className={linkCls("/browse")}>📚 <span>Past Papers</span></Link>
        <Link to="/quizzes" className={linkCls("/quizzes")}>🎯 <span>Quizzes</span></Link>
        <Link to="/battles" className={linkCls("/battles")}>⚔️ <span>Quiz Battles</span></Link>
        <Link to="/redeem" className={linkCls("/redeem")}>🎫 <span>Redeem Code</span></Link>
        <Link to="/boss-battle" className={linkCls("/boss-battle")}>🐉 <span>Boss Battle</span></Link>
        <Link to="/essay" className={linkCls("/essay")}>✍️ <span>Essay Practice</span></Link>
        <Link to="/battles" className={linkCls("/battles")}>⚔️ <span>Quiz Battles</span></Link>
        <Link to="/worksheet" className={linkCls("/worksheet")}>🖨️ <span>Worksheets</span></Link>
        <Link to="/careers" className={linkCls("/careers")}>🧭 <span>Career Roadmap</span></Link>
        <Link to="/teams" className={linkCls("/teams")}>👥 <span>Study Teams</span></Link>
        <Link to="/notes" className={linkCls("/notes")}>📝 <span>Notes</span></Link>
        <Link to="/timetable" className={linkCls("/timetable")}>🗓️ <span>Exam Timetable</span></Link>

        <SectionLabel>Community</SectionLabel>
        <Link to="/leaderboard" className={linkCls("/leaderboard")}>🏆 <span>Leaderboard</span></Link>
        <Link to="/classes" className={linkCls("/classes")}>🏫 <span>Classes</span></Link>
        <Link to="/bots" className={linkCls("/bots")}>🤖 <span>AI Tutors</span></Link>
        <Link to="/news" className={linkCls("/news")}>📰 <span>News</span></Link>

        <SectionLabel>Account</SectionLabel>
        {user ? (
          <>
            {roleLink()}
            <Link to="/profile" className={linkCls("/profile")}>👤 <span>My Profile</span></Link>
            <Link to="/parent" className={linkCls("/parent")}>👨‍👩‍👧 <span>Parent Dashboard</span></Link>
            <Link to="/achievements" className={linkCls("/achievements")}>🏅 <span>Achievements</span></Link>
            <Link to="/bookmarks" className={linkCls("/bookmarks")}>🔖 <span>Saved</span></Link>
            <Link to="/settings" className={linkCls("/settings")}>⚙️ <span>Settings</span></Link>
          </>
        ) : (
          <>
            <Link to="/login" className={linkCls("/login")}>🔑 <span>Login</span></Link>
            <Link to="/register" className={linkCls("/register")}>📝 <span>Sign Up</span></Link>
          </>
        )}

        <SectionLabel>About</SectionLabel>
        <Link to="/about" className={linkCls("/about")}>ℹ️ <span>About</span></Link>
        <Link to="/pricing" className={linkCls("/pricing")}>💳 <span>Pricing</span></Link>
        <Link to="/contact" className={linkCls("/contact")}>📧 <span>Contact</span></Link>
        <Link to="/api-docs" className={linkCls("/api-docs")}>🔌 <span>API Docs</span></Link>
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">{user.name?.[0]?.toUpperCase()}</div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{user.name}</div>
                <div className="text-xs text-gray-400 truncate">{user.role === "super_admin" ? "Super Admin" : user.role === "omni_super" ? "Omni Super" : user.role}</div>
              </div>
            </div>
            <button onClick={logout} title="Logout" className="text-gray-400 hover:text-red-500 ml-2 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        ) : (
          <button onClick={() => setDark(!dark)} className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 py-2 hover:text-gray-700">
            {dark ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        )}

        {user && savedSessions.length > 1 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Device profiles</div>
            <div className="space-y-1">
              {savedSessions.filter((s: any) => s.user.id !== user.id).map((s: any) => (
                <div key={s.user.id} onClick={() => switchAccount(s)} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{s.user.name?.[0]?.toUpperCase()}</div>
                  <span className="text-xs truncate flex-1">{s.user.name}</span>
                  <button onClick={(e) => removeSession(s.user.id, e)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 text-xs">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-40 flex-col">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 shadow-xl flex-col animate-slide-in-left">{sidebar}</aside>
        </div>
      )}

      {/* Main area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3">
              <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <Link to="/" className="lg:hidden text-lg font-bold"><span className="text-green-600">John</span><span className="text-orange-500">Web</span></Link>
              <div className="hidden lg:block text-sm text-gray-500">Zambian ECZ Past Papers</div>
            </div>
            <div className="flex items-center gap-3">
              {user && <NotificationBell />}
              <button onClick={() => setDark(!dark)} className="text-gray-500 hover:text-gray-700" title="Toggle dark mode">{dark ? "☀️" : "🌙"}</button>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {streak && streak.streak > 0 && !streak.activeToday && (
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center text-sm py-2 px-4">
              🔥 <strong>{streak.streak}-day streak!</strong> Answer one question today to keep it going.{" "}
              <Link to="/browse" className="underline font-medium">Practice now →</Link>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
