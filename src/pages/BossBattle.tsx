import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

interface Q {
  id: string;
  text: string;
  options?: string[];
  marks: number;
}

export default function BossBattle() {
  usePageTitle("Boss Battle");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [battle, setBattle] = useState<Q[]>([]);
  const [week, setWeek] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return navigate("/login");
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) navigate("/login"); else setUser(d); });
    fetch("/api/boss-battle", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => {
        setBattle(d.battle || []);
        setWeek(d.week || "");
        setAlreadyDone(d.alreadyDone);
      });
  }, [navigate]);

  const submit = async () => {
    const t = localStorage.getItem("token");
    const payload = Object.entries(answers).map(([questionId, content]) => ({ questionId, content }));
    if (!payload.length) return alert("Answer at least one question");
    setLoading(true);
    const res = await fetch("/api/boss-battle/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ answers: payload }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) alert(data.error);
    else { setResult(data); setAlreadyDone(true); }
  };

  if (!user) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">🐉 Weekly Boss Battle</div>
            <div className="opacity-90 text-sm">10 hardest questions. Beat the boss, earn XP + a badge.</div>
            <div className="text-xs opacity-80 mt-1">Week of {week}</div>
          </div>
          <Link to="/browse" className="bg-white/20 px-3 py-1.5 rounded-lg text-sm hover:bg-white/30">← Back</Link>
        </div>
      </div>

      {alreadyDone && !result && (
        <div className="bg-white rounded-xl border shadow-sm p-6 text-center">
          <div className="text-4xl mb-2">⚔️</div>
          <h2 className="text-xl font-bold">You already fought this week's boss!</h2>
          <p className="text-gray-500 mt-1">Come back next week for a new challenge.</p>
        </div>
      )}

      {!alreadyDone && battle.length > 0 && (
        <>
          <div className="space-y-4 mb-6">
            {battle.map((q, i) => (
              <div key={q.id} className="bg-white rounded-xl border shadow-sm p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-gray-400">Boss Question {i + 1} of {battle.length}</span>
                  <span className="text-xs text-gray-400">[{q.marks} marks]</span>
                </div>
                <p className="text-gray-800 mb-3">{q.text}</p>
                {q.options && q.options.length > 0 ? (
                  <div className="space-y-2">
                    {q.options.map((opt: string, oi: number) => (
                      <label key={oi} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition ${answers[q.id] === opt ? "border-red-500 bg-red-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} className="accent-red-600" />
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
          <button onClick={submit} disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-red-700 disabled:opacity-50">
            {loading ? "Fighting the boss..." : "⚔️ Submit Battle"}
          </button>
        </>
      )}

      {result && (
        <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
          <div className="text-5xl mb-3">{result.percentage >= 80 ? "🐉" : result.percentage >= 50 ? "⚔️" : "🛡️"}</div>
          <h2 className="text-2xl font-bold">{result.badge}</h2>
          <div className="text-4xl font-bold text-red-600 my-3">{result.percentage}%</div>
          <p className="text-gray-500">{result.score} of {result.total} correct · +{result.xp} XP earned</p>
          <div className="flex gap-2 justify-center mt-4">
            <Link to="/achievements" className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium">View Achievements</Link>
            <Link to="/browse" className="px-5 py-2 rounded-lg border font-medium">Keep Practicing</Link>
          </div>
        </div>
      )}
    </div>
  );
}
