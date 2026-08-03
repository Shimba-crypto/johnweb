import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Battles() {
  usePageTitle("Quiz Battles");
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [paperId, setPaperId] = useState("");
  const [count, setCount] = useState(10);
  const [joinCode, setJoinCode] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) try { setUser(JSON.parse(u)); } catch {}
    fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
  }, []);

  const allPapers = subjects.flatMap((s) => (s.papers || []).map((p) => ({ ...p, subjectName: s.name })));

  const createBattle = async () => {
    if (!user) return alert("Login to create a battle");
    const t = localStorage.getItem("token");
    const res = await fetch("/api/battles", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ paperId: paperId || undefined, count }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else {
      sessionStorage.setItem(`battle-${data.id}`, JSON.stringify({ questions: data.questions, myName: user.name }));
      navigate(`/battle/${data.id}?code=${data.code}`);
    }
  };

  const joinBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Login to join a battle");
    const t = localStorage.getItem("token");
    const res = await fetch("/api/battles/join", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ code: joinCode.trim() }),
    });
    const data = await res.json();
    if (data.error) setMsg(data.error);
    else {
      sessionStorage.setItem(`battle-${data.id}`, JSON.stringify({ questions: data.questions, opponentName: data.opponentName, myName: user.name }));
      navigate(`/battle/${data.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">⚔️ Quiz Battles</h1>
      <p className="text-gray-500 mb-8">Challenge a friend — both answer the same questions, highest score wins!</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold text-lg mb-1">Create a Battle</h2>
          <p className="text-sm text-gray-500 mb-4">Pick questions and share the code with a friend.</p>
          <select value={paperId} onChange={(e) => setPaperId(e.target.value)} className="w-full p-2 border rounded-lg mb-3">
            <option value="">Random questions (all subjects)</option>
            {allPapers.map((p) => <option key={p.id} value={p.id}>{p.subjectName} | {p.title}</option>)}
          </select>
          <select value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="w-full p-2 border rounded-lg mb-3">
            <option value={10}>10 questions</option>
            <option value={20}>20 questions</option>
            <option value={30}>30 questions</option>
            <option value={50}>50 questions</option>
          </select>
          <button onClick={createBattle} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">⚔️ Create Battle</button>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h2 className="font-semibold text-lg mb-1">Join a Battle</h2>
          <p className="text-sm text-gray-500 mb-4">Enter the code your friend shared.</p>
          <form onSubmit={joinBattle}>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="e.g. A1B2C3" className="w-full p-2 border rounded-lg mb-3 text-center text-xl tracking-widest font-mono uppercase" maxLength={6} required />
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Join Battle</button>
          </form>
          {msg && <p className="text-red-600 text-sm mt-2">{msg}</p>}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold mb-2">How it works</h3>
        <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-1">
          <li>Player 1 creates a battle and shares the 6-letter code</li>
          <li>Player 2 joins with the code</li>
          <li>Both answer the same questions</li>
          <li>Submit your answers — results show who won</li>
        </ol>
        {!user && <p className="text-sm mt-2 text-blue-700"><Link to="/login" className="underline">Login</Link> to battle</p>}
      </div>
    </div>
  );
}
