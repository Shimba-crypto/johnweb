import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

const JOHN_EMAIL = "silungwejohn24@gmail.com";

export default function Johnx() {
  usePageTitle("John Access");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (submitting) return;
    if (!navigator.onLine) {
      setError("You appear to be offline. Check your connection and try again.");
      return;
    }
    setSubmitting(true);
    const timer = setTimeout(() => {
      setSubmitting(false);
      setError("The server is taking too long to respond. Check your connection and try again.");
    }, 20000);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: JOHN_EMAIL, password }),
      });
      clearTimeout(timer);
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(data.user));
        try {
          const sessions = JSON.parse(localStorage.getItem("jwSessions") || "[]");
          const entry = { token: data.token, user: data.user };
          const idx = sessions.findIndex((s: any) => s.user.id === data.user.id);
          if (idx >= 0) sessions[idx] = entry; else sessions.push(entry);
          localStorage.setItem("jwSessions", JSON.stringify(sessions.slice(-5)));
        } catch {}
        navigate("/browse");
      } else {
        setError(data.error);
      }
    } catch {
      clearTimeout(timer);
      setError("Could not reach the server. Check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-2">John Access</h1>
      <p className="text-center text-gray-500 mb-8">
        Private entry for the boss. Enter your password to sign in.
      </p>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoFocus
            required
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-600 text-white rounded-lg py-2 font-semibold hover:bg-teal-700 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Enter as John"}
        </button>
        <p className="text-center text-sm">
          <Link to="/login" className="text-teal-600 hover:underline">
            Use email login instead
          </Link>
        </p>
      </form>
    </div>
  );
}
