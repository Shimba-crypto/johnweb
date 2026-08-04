import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function QuizAnalytics() {
  usePageTitle("Quiz Analytics");
  const [user, setUser] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error || !["teacher", "admin", "super_admin"].includes(d.role)) navigate("/"); else setUser(d); })
      .catch(() => navigate("/"));
    fetch("/api/quizzes").then((r) => r.json()).then(setQuizzes);
  }, [navigate]);

  useEffect(() => {
    if (selected) {
      fetch(`/api/quiz-analytics/${selected}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then((r) => r.json()).then(setAnalytics);
    }
  }, [selected]);

  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Quiz Analytics</h1>
      <p className="text-gray-500 mb-8">See how students perform on each quiz</p>

      <div className="mb-6">
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full p-2 border rounded-lg">
          <option value="">Select a quiz...</option>
          {quizzes.map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border shadow-sm text-center"><div className="text-2xl font-bold text-blue-600">{analytics.attempts}</div><div className="text-sm text-gray-500">Attempts</div></div>
            <div className="bg-white p-4 rounded-xl border shadow-sm text-center"><div className="text-2xl font-bold text-green-600">{analytics.avgScore}%</div><div className="text-sm text-gray-500">Average Score</div></div>
            <div className="bg-white p-4 rounded-xl border shadow-sm text-center"><div className="text-2xl font-bold text-orange-600">{analytics.bestScore}%</div><div className="text-sm text-gray-500">Best Score</div></div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Question Difficulty</h2>
          <div className="space-y-3">
            {analytics.perQuestion.map((q: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Q{q.questionNumber}. {q.text}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${q.accuracy >= 70 ? "bg-green-100 text-green-700" : q.accuracy >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{q.accuracy}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${q.accuracy}%` }} /></div>
                <div className="text-xs text-gray-400 mt-1">{q.correctCount}/{q.attempts} correct</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
