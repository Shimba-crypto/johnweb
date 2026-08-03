import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function InviteJoin() {
  usePageTitle("Join via Invite");
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setNotFound(true); else setInvite(d); })
      .catch(() => setNotFound(true));
  }, [token]);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match.");
    const res = await fetch(`/api/invites/${token}/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Registration failed"); return; }
    // auto-login
    try {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("refreshToken", loginData.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(loginData.user));
        window.location.href = "/browse";
        return;
      }
    } catch {}
    setDone(true);
  };

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-3">❌</div>
        <h1 className="text-xl font-bold mb-2">Invite not found</h1>
        <p className="text-gray-500 mb-4">This invite link is invalid or has expired.</p>
        <Link to="/" className="text-green-600 hover:underline">Go home</Link>
      </div>
    );
  }

  if (!invite) return <div className="max-w-md mx-auto px-4 py-16 text-center">Loading...</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold">You're invited to JohnWeb!</h1>
        {invite.teacherName && <p className="text-gray-600 mt-1">From: <strong>{invite.teacherName}</strong></p>}
        {invite.school && <p className="text-gray-500 text-sm">School: <strong>{invite.school}</strong></p>}
        <p className="text-xs text-gray-400 mt-1">Role: {invite.role}</p>
      </div>

      {done ? (
        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl text-center">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="font-bold text-lg mb-1">Welcome, {name}!</h3>
          <p className="text-sm mb-4">Your account is ready.</p>
          <Link to="/login" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">Login</Link>
        </div>
      ) : (
        <form onSubmit={register} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Create a Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 chars, letters + numbers" className="w-full p-2 border rounded-lg" required minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full p-2 border rounded-lg" required />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Accept Invite & Join</button>
        </form>
      )}
    </div>
  );
}
