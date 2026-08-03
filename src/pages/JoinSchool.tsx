import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function JoinSchool() {
  usePageTitle("Join Primarysteps School");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMsg("");
    if (password !== confirm) return setError("Passwords do not match.");
    const res = await fetch("/api/register-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password, school: "primarysteps", teacherName: "Silungwe John", teacherId: "silungwejohn" }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Registration failed");
    else { setMsg(data.message); setDone(true); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🏫</div>
        <h1 className="text-2xl font-bold">Primarysteps School</h1>
        <p className="text-gray-500">Teacher: <strong>Silungwe John</strong></p>
        <p className="text-gray-400 text-sm mt-1">Enter your name and create a password to join.</p>
      </div>

      {done ? (
        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl text-center">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="font-bold text-lg mb-1">Welcome, {name}!</h3>
          <p className="mb-4 text-sm">{msg} You can now log in.</p>
          <Link to="/login" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Banda" className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Create a Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters, letters + numbers" className="w-full p-2 border rounded-lg" required minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full p-2 border rounded-lg" required />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Join Primarysteps School</button>
          <p className="text-xs text-gray-400 text-center">You'll be registered under Primarysteps School, teacher Silungwe John.</p>
        </form>
      )}
    </div>
  );
}
