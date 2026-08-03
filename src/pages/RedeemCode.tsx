import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function RedeemCode() {
  usePageTitle("Redeem Code");
  const [user, setUser] = useState<any>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) try { setUser(JSON.parse(u)); } catch {}
  }, []);

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Login to redeem a code");
    setMsg(""); setError("");
    const t = localStorage.getItem("token");
    const res = await fetch("/api/codes/redeem", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else { setMsg(data.message); localStorage.setItem("user", JSON.stringify({ ...user, subscription: data.plan })); setCode(""); }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-center mb-2">Redeem Access Code</h1>
      <p className="text-gray-500 text-center mb-8">Enter the code your teacher or parent gave you to unlock your plan.</p>

      <form onSubmit={redeem} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
        {msg && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm text-center font-medium">✅ {msg}</div>}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Access Code</label>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="JOHN-XXXX-XXXX-XXXX" className="w-full p-2 border rounded-lg text-center text-lg tracking-widest font-mono" required />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">Redeem Code</button>
        {!user && <p className="text-sm text-center text-gray-500"><Link to="/login" className="text-green-600 hover:underline">Login</Link> first to redeem</p>}
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        Codes are purchased from your school or teacher and each unlocks one plan.
      </p>
    </div>
  );
}
