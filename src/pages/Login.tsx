import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
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
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">
          Login
        </button>
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-gray-500 hover:text-green-600 hover:underline">Forgot password?</Link>
          <span className="text-gray-500">Don&apos;t have an account? <Link to="/register" className="text-green-600 hover:underline">Sign up</Link></span>
        </div>
      </form>
      <div className="relative my-4 text-center">
        <span className="bg-gray-100 px-3 py-1 text-xs text-gray-500 rounded-full">or</span>
      </div>
      <button
        onClick={() => {
          const gEmail = prompt("Enter your Google email to sign in:");
          if (!gEmail || !gEmail.includes("@")) return;
          const gName = gEmail.split("@")[0].replace(/[._]/g, " ");
          fetch("/api/auth/google", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: gEmail, name: gName }),
          }).then((r) => r.json()).then((data) => {
            if (data.error) setError(data.error);
            else {
              localStorage.setItem("token", data.token);
              localStorage.setItem("refreshToken", data.refreshToken || "");
              localStorage.setItem("user", JSON.stringify(data.user));
              navigate("/browse");
            }
          });
        }}
        className="w-full bg-white border border-gray-300 py-2 rounded-lg hover:bg-gray-50 font-medium text-gray-700 flex items-center justify-center gap-2"
      >
        <span className="text-lg">G</span> Continue with Google
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">Uses your email to create or log into your account.</p>
    </div>
  );
}
