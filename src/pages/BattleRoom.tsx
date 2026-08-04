import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function BattleRoom() {
  usePageTitle("Quiz Battle");
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [opponentName, setOpponentName] = useState("");
  const code = params.get("code");
  const token = () => localStorage.getItem("token");

  useEffect(() => {
    const stored = sessionStorage.getItem(`battle-${id}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setQuestions(data.questions || []);
        setOpponentName(data.opponentName || "");
      } catch {}
    }
  }, [id]);

  const submit = async () => {
    setSubmitting(true);
    const formatted = Object.entries(answers).map(([questionId, content]) => ({ questionId, content }));
    const res = await fetch(`/api/battles/${id}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ answers: formatted }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  };

  if (result) {
    const me = result.results?.find((r: any) => r.userId === localStorage.getItem("userId")) || result.results?.[0];
    const opponent = result.results?.find((r: any) => r !== me);
    const winner = result.winner;
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-3">{result.winner ? "🏆" : "🤝"}</div>
        <h1 className="text-2xl font-bold mb-2">{result.winner ? `${winner.name} wins!` : "Battle complete"}</h1>
        <p className="text-gray-500 mb-6">{result.status}</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {result.results?.map((r: any, i: number) => (
            <div key={i} className={`bg-white p-5 rounded-xl border shadow-sm ${r === winner ? "border-yellow-400" : ""}`}>
              <div className="font-semibold">{r.name} {r === winner && "👑"}</div>
              <div className="text-3xl font-bold text-green-600">{r.correct}/{questions.length}</div>
              <div className="text-xs text-gray-400">{r.pct}%</div>
            </div>
          ))}
        </div>
        <Link to="/battles" className="text-green-600 hover:underline">Back to Battles</Link>
      </div>
    );
  }

  if (questions.length === 0) return <div className="max-w-3xl mx-auto px-4 py-8">Loading battle...</div>;

  const answered = Object.keys(answers).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">⚔️ Quiz Battle</h1>
          <p className="text-gray-500 text-sm">{opponentName ? `You vs ${opponentName}` : "Waiting for opponent..."} · {code ? `Code: ${code}` : ""}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold">{answered}/{questions.length} answered</div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => (
          <div key={qi} className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">Question {qi + 1}</h3>
              <span className="text-sm text-gray-400">[{q.marks} marks]</span>
            </div>
            <p className="text-gray-800 mb-3">{q.text}</p>
            {q.options && q.options.length > 0 ? (
              <div className="space-y-2">
                {q.options.map((opt: string, oi: number) => (
                  <label key={oi} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${answers[q.id] === opt ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name={`bq-${qi}`} checked={answers[q.id] === opt} onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} className="accent-green-600" />
                    <span className="text-sm">{String.fromCharCode(65 + oi)}. {opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea value={answers[q.id] || ""} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} placeholder="Your answer..." className="w-full p-3 border rounded-lg min-h-[80px]" />
            )}
          </div>
        ))}
      </div>

      <button onClick={submit} disabled={submitting || answered < questions.length} className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 text-lg">
        {submitting ? "Submitting..." : answered < questions.length ? `Answer all (${answered}/${questions.length})` : "🏁 Submit & See Results"}
      </button>
    </div>
  );
}
