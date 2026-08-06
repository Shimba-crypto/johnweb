import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function JohnxAuto() {
  usePageTitle("John Access");
  const { key } = useParams<{ key: string }>();
  const [error, setError] = useState("");
  const [tried, setTried] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!key) { setError("Missing access link."); setTried(true); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) { setError("The server is taking too long to respond. Try again."); setTried(true); }
    }, 45000);
    (async () => {
      try {
        const res = await fetch("/api/auth/johnx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        });
        clearTimeout(timer);
        const data = await res.json();
        if (cancelled) return;
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
          setError(data.error || "Access link failed.");
          setTried(true);
        }
      } catch {
        clearTimeout(timer);
        if (!cancelled) { setError("Could not reach the server. Check your connection."); setTried(true); }
      }
    })();
    return () => { cancelled = true; };
  }, [key, navigate]);

  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">🔑</div>
      {!tried && !error ? (
        <>
          <h1 className="text-2xl font-bold mb-2">Signing you in…</h1>
          <p className="text-gray-500">One moment, John.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link to="/johnx" className="text-teal-600 hover:underline text-sm">Use the password page instead</Link>
        </>
      )}
    </div>
  );
}
