import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

interface Q { id: string; text: string; options?: string[]; marks: number; }

export default function Battles() {
  usePageTitle("Quiz Battles");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [paperId, setPaperId] = useState("");
  const [mode, setMode] = useState<"home" | "playing" | "done">("home");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [battleId, setBattleId] = useState("");
  const [battleCode, setBattleCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return navigate("/login");
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) navigate("/login"); else setUser(d); });
    fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
  }, [navigate, token]);

  const allPapers = subjects.flatMap((s: any) => (s.papers || []).map((p: any) => ({ ...p, subjectName: s.name })));

  const create = async () => {
    setErr("");
    const body = paperId ? { paperId, count: 10 } : { count: 10 };
    const res = await fetch("/api/battles", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    const d = await res.json();
    if (d.error) return setErr(d.error);
    setBattleId(d.id); setBattleCode(d.code); setQuestions(d.questions); setMode("playing");
  };

  const join = async () => {
    setErr("");
    const res = await fetch("/api/battles/join", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code: joinCode }) });
    const d = await res.json();
    if (d.error) return setErr(d.error);
    setBattleId(d.id); setBattleCode(d.code); setQuestions(d.questions); setMode("playing");
  };

  const submit = async () => {
    setErr("");
    const payload = Object.entries(answers).map(([questionId, content]) => ({ questionId, content }));
    if (!payload.length) return setErr("Answer at least one question");
    const res = await fetch(`/api/battles/${battleId}/submit`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ answers: payload }) });
    const d = await res.json();
    if (d.error) return setErr(d.error);
    setResult(d); setMode("done");
  };

  if (!user) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;

  if (mode === "home") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">⚔️ Quiz Battles</h1>
            <p className="text-gray-500">Challenge a friend to 10 questions</p>
          </div>
          <Link to="/browse" className="text-sm text-green-600 hover:underline">← Back</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold mb-3">Create a battle</h3>
            <select value={paperId} onChange={(e) => setPaperId(e.target.value)} className="w-full p-2 border rounded-lg mb-3">
              <option value="">Any subject (mix of questions)</option>
              {allPapers.map((p) => <option key={p.id} value={p.id}>{p.subjectName} | {p.title}</option>)}
            </select>
            <button onClick={create} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">⚡ Start Battle</button>
          </div>
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold mb-3">Join a battle</h3>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="BATTLE CODE" className="w-full p-2 border rounded-lg mb-3 font-mono" />
            <button onClick={join} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">🔗 Join</button>
          </div>
        </div>
        {err && <p className="text-red-600 text-sm mt-3">{err}</p>}
      </div>
    );
  }

  if (mode === "playing") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl p-4 mb-5">
          <div className="flex justify-between items-center">
            <div className="font-bold">⚔️ Battle in progress</div>
            <div className="font-mono bg-white/20 px-2 py-0.5 rounded text-sm">CODE: {battleCode}</div>
          </div>
          <div className="text-xs opacity-80 mt-1">Share this code with your opponent. Both answer the same 10 questions.</div>
        </div>
        <div className="space-y-4 mb-5">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="text-xs text-gray-400 mb-2">Q{i + 1} of {questions.length} [{q.marks} marks]</div>
              <p className="text-gray-800 mb-3">{q.text}</p>
              {q.options && q.options.length > 0 ? (
                <div className="space-y-2">
                  {q.options.map((opt: string, oi: number) => (
                    <label key={oi} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${answers[q.id] === opt ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:bg-gray-50"}`}>
                      <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} className="accent-purple-600" />
                      <span className="text-sm">{String.fromCharCode(65 + oi)}. {opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea value={answers[q.id] || ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} placeholder="Write your answer..." className="w-full p-2.5 border rounded-lg min-h-[70px]" />
              )}
            </div>
          ))}
        </div>
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        <button onClick={submit} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-purple-700">⚔️ Submit My Answers</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="text-2xl font-bold">Battle Complete</h2>
        {result?.results?.length >= 2 ? (
          <div className="mt-4 space-y-2">
            {result.results.map((r: any, i: number) => (
              <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${i === 0 && result.winner?.userId === r.userId ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}>
                <span className="font-medium">{r.name} {result.winner?.userId === r.userId && "👑"}</span>
                <span className="font-bold">{r.pct}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-3">Your score: <b>{result?.results?.[0]?.pct}%</b>. Wait for your opponent to finish, or create a new battle.</p>
        )}
        <div className="flex gap-2 justify-center mt-6">
          <button onClick={() => { setMode("home"); setResult(null); setAnswers({}); }} className="bg-purple-600 text-white px-5 py-2 rounded-lg font-medium">New Battle</button>
          <Link to="/browse" className="px-5 py-2 rounded-lg border font-medium">Keep Practicing</Link>
        </div>
      </div>
    </div>
  );
}
