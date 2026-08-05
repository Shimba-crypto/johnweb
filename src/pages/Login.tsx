import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

export default function Login() {
  usePageTitle("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [error, setError] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((d) => { if (d.googleClientId) setGoogleClientId(d.googleClientId); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!googleClientId) return;
    let cancelled = false;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      if (cancelled || !window.google?.accounts) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (!response?.credential) { setError("Google sign-in failed. Try again."); return; }
          setGoogleLoading(true);
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: response.credential }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Google sign-in failed"); setGoogleLoading(false); return; }
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
          } catch {
            setError("Could not reach the server. Check your connection.");
            setGoogleLoading(false);
          }
        },
      });
      if (googleBtnRef.current) {
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          shape: "rectangular",
          width: 400,
          text: "continue_with",
        });
      }
    };
    document.body.appendChild(script);
    return () => { cancelled = true; };
  }, [googleClientId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!navigator.onLine) {
      setError("You appear to be offline. Check your connection and try again.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    const timer = setTimeout(() => {
      setSubmitting(false);
      setError("The server is taking too long to respond. Check your connection and try again.");
    }, 20000);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      clearTimeout(timer);
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("refreshToken", data.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(data.user));
        // Save session for quick device profile switching
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
      <h1 className="text-3xl font-bold text-center mb-8">Login</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded-lg" required />
        </div>
        <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-60">
          {submitting ? "Signing in…" : "Login"}
        </button>
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-gray-500 hover:text-green-600 hover:underline">Forgot password?</Link>
          <span className="text-gray-500">Don&apos;t have an account? <Link to="/register" className="text-green-600 hover:underline">Sign up</Link></span>
        </div>
      </form>
      {googleClientId && (
        <>
          <div className="relative my-4 text-center">
            <span className="bg-gray-100 px-3 py-1 text-xs text-gray-500 rounded-full">or</span>
          </div>
          <div className="flex justify-center">
            <div ref={googleBtnRef} className="google-signin-btn" />
          </div>
          {googleLoading && <p className="text-xs text-gray-400 text-center mt-2">Signing you in…</p>}
        </>
      )}
      {!googleClientId && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Google sign-in is not configured yet. Use your email and password above.
        </p>
      )}
    </div>
  );
}
