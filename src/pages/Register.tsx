import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Register() {
  usePageTitle("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const [loggedInUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, ref }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    // Auto-login so new accounts land straight in
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("refreshToken", loginData.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(loginData.user));
        navigate("/browse");
        return;
      }
    } catch {}
    navigate("/login");
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      {loggedInUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-amber-800">⚠️ You're signed in as <strong>{loggedInUser.name}</strong>. Creating a new account will <strong>log you out</strong> of this one.</p>
        </div>
      )}
      {ref && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
          <div className="text-2xl mb-1">🎁</div>
          <p className="text-sm text-green-800 font-medium">A friend invited you!</p>
          <p className="text-xs text-green-700 mt-1">Create an account and get a <strong>FREE week of Student Plus (K50 plan)</strong>.</p>
        </div>
      )}
      <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded-lg" required />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">
          Sign Up
        </button>
        <p className="text-sm text-center text-gray-500">
          Already have an account? <Link to="/login" className="text-green-600 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
