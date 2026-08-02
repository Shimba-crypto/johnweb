import { useEffect, useState, useCallback } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import Footer from "./Footer";

export default function Layout() {
  const [user, setUser] = useState<any>(null);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const loadUser = useCallback(() => {
    const stored = localStorage.getItem("user");
    try { setUser(stored ? JSON.parse(stored) : null); } catch { setUser(null); }
  }, []);

  useEffect(() => { loadUser(); }, [location.pathname, loadUser]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, [loadUser]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const roleNav = () => {
    if (!user) return null;
    switch (user.role) {
      case "super_admin":
      case "admin": return <Link to="/admin" className="block md:inline text-gray-600 hover:text-gray-900 py-1" onClick={() => setMenuOpen(false)}>Admin</Link>;
      case "teacher": return <Link to="/teacher" className="block md:inline text-gray-600 hover:text-gray-900 py-1" onClick={() => setMenuOpen(false)}>Grade</Link>;
      case "investor": return <Link to="/investor" className="block md:inline text-gray-600 hover:text-gray-900 py-1" onClick={() => setMenuOpen(false)}>Analytics</Link>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 md:h-16 items-center">
            <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
              <span className="text-lg md:text-xl font-bold">
                <span className="text-green-600">John</span>
                <span className="text-orange-500">Web</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-3 text-sm">
              <Link to="/browse" className="text-gray-600 hover:text-gray-900">Papers</Link>
              <Link to="/quizzes" className="text-gray-600 hover:text-gray-900">Quizzes</Link>
              <Link to="/teams" className="text-gray-600 hover:text-gray-900">Teams</Link>
              <Link to="/leaderboard" className="text-gray-600 hover:text-gray-900">Top</Link>
              <Link to="/bots" className="text-gray-600 hover:text-gray-900">Bots</Link>
              <Link to="/news" className="text-gray-600 hover:text-gray-900">News</Link>
              <Link to="/notes" className="text-gray-600 hover:text-gray-900">Notes</Link>
              <Link to="/timetable" className="text-gray-600 hover:text-gray-900">Timetable</Link>
              <Link to="/bookmarks" className="text-gray-600 hover:text-gray-900">Saved</Link>
              <Link to="/api-docs" className="text-gray-600 hover:text-gray-900">API</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              {roleNav()}
              {user ? (
                <>
                  <NotificationBell />
                  <Link to="/achievements" className="text-gray-600 hover:text-gray-900">🏆</Link>
                  <Link to="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
                  <Link to="/profile" className="text-gray-600 hover:text-gray-900 font-medium">{user.name}</Link>
                  <button onClick={logout} className="text-gray-500 hover:text-gray-700">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                  <Link to="/register" className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm">Sign Up</Link>
                </>
              )}
              <button onClick={() => setDark(!dark)} className="text-gray-500 hover:text-gray-700 ml-1" title="Toggle dark mode">
                {dark ? "☀️" : "🌙"}
              </button>
            </div>

            {/* Mobile hamburger */}
            <div className="flex md:hidden items-center gap-2">
              {user && <NotificationBell />}
              <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile nav panel */}
          {menuOpen && (
            <div className="md:hidden border-t border-gray-200 py-3 space-y-1 text-sm">
              <Link to="/browse" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Past Papers</Link>
              <Link to="/quizzes" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Quizzes</Link>
              <Link to="/teams" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Teams</Link>
              <Link to="/leaderboard" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Leaderboard</Link>
              <Link to="/bots" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>AI Bots</Link>
              <Link to="/news" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>News</Link>
              <Link to="/notes" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Notes</Link>
              <Link to="/timetable" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Timetable</Link>
              <Link to="/bookmarks" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Saved Questions</Link>
              <Link to="/api-docs" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>API Docs</Link>
              <Link to="/pricing" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link to="/about" className="block px-2 py-2 text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>About</Link>
              {roleNav()}
              <hr className="my-2" />
              {user ? (
                <>
                  <Link to="/profile" className="block px-2 py-2 font-medium text-gray-800" onClick={() => setMenuOpen(false)}>{user.name}</Link>
                  <Link to="/settings" className="block px-2 py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Settings</Link>
                  <button onClick={logout} className="block w-full text-left px-2 py-2 text-red-600">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-2 py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="block px-2 py-2 text-green-600 font-medium" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                </>
              )}
              <hr className="my-2" />
              <div className="flex items-center gap-2 px-2 py-2">
                <button onClick={() => setDark(!dark)} className="text-gray-500 hover:text-gray-700">{dark ? "☀️ Light mode" : "🌙 Dark mode"}</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
