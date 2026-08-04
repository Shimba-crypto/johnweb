import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function ForgotPassword() {
  usePageTitle("Reset Password");
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMsg("");
    const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (data.token) {
      setMsg(`Reset token: ${data.token}`);
      setStep("reset");
    } else setMsg(data.message || "Check your email");
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMsg("");
    const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, newPassword }) });
    const data = await res.json();
    if (data.error) setError(data.error);
    else { setMsg(data.message); setStep("done"); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-8">Reset Password</h1>

      {step === "email" && (
        <form onSubmit={requestReset} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          {msg && <p className="text-green-600 text-sm">{msg}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <p className="text-sm text-gray-500">Enter your email and we'll provide a reset token.</p>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-lg" required />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Request Reset</button>
          <p className="text-sm text-center text-gray-500"><Link to="/login" className="text-green-600 hover:underline">Back to login</Link></p>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={resetPassword} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <p className="text-xs text-gray-400">Use the token shown (in production this is emailed to you).</p>
          <div>
            <label className="block text-sm font-medium mb-1">Reset Token</label>
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} className="w-full p-2 border rounded-lg font-mono text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 border rounded-lg" required minLength={6} />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Reset Password</button>
        </form>
      )}

      {step === "done" && (
        <div className="bg-white p-6 rounded-xl border shadow-sm text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-bold text-lg mb-2">{msg}</h3>
          <Link to="/login" className="text-green-600 hover:underline font-medium">Login</Link>
        </div>
      )}
    </div>
  );
}
