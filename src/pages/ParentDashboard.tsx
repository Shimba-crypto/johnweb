import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function ParentDashboard() {
  usePageTitle("Parent Dashboard");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return navigate("/login");
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) navigate("/login"); else setUser(d); });
    fetch("/api/parent/dashboard", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setChildren);
  }, [navigate, token]);

  const link = async () => {
    setErr(""); setMsg("");
    if (!code.trim()) return setErr("Enter your child's code (their profile user id).");
    const res = await fetch("/api/parent/link", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ childId: code.trim() }),
    });
    const d = await res.json();
    if (d.error) setErr(d.error);
    else { setMsg(d.message + ": " + d.child.name); setCode(""); fetch("/api/parent/dashboard", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setChildren); }
  };

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">👨‍👩‍👧 Parent Dashboard</h1>
          <p className="text-gray-500">Track your child's exam readiness</p>
        </div>
        <Link to="/profile" className="text-sm text-green-600 hover:underline">← Back</Link>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5 mb-8">
        <h3 className="font-semibold mb-2">Link your child</h3>
        <p className="text-sm text-gray-500 mb-3">Ask your child to open their profile and copy their <b>user id</b> (or the link after /user/). Paste it here.</p>
        <div className="flex gap-2">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Child's user id / code" className="flex-1 p-2 border rounded-lg" />
          <button onClick={link} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Link</button>
        </div>
        {msg && <p className="text-green-600 text-sm mt-2">{msg}</p>}
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
        {user.children?.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">My linked children: {user.children.length} · Your code is <b>{user.id}</b></p>
        )}
      </div>

      {children.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center text-gray-500">
          No children linked yet. Add your child's code above.
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{c.name}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${c.readiness === "Ready for the exam" ? "bg-green-100 text-green-700" : c.readiness === "Getting there" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{c.readiness}</span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center text-sm">
                <div className="bg-gray-50 rounded-lg p-3"><div className="font-bold">{c.answers}</div><div className="text-xs text-gray-500">Answers</div></div>
                <div className="bg-gray-50 rounded-lg p-3"><div className="font-bold">{c.correct}</div><div className="text-xs text-gray-500">Correct</div></div>
                <div className="bg-gray-50 rounded-lg p-3"><div className="font-bold">{c.pct}%</div><div className="text-xs text-gray-500">Accuracy</div></div>
                <div className="bg-gray-50 rounded-lg p-3"><div className="font-bold">🔥{c.streak}</div><div className="text-xs text-gray-500">Streak</div></div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
