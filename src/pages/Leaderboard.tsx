import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Leaderboard() {
  usePageTitle("Leaderboard");
  const [rankings, setRankings] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  useEffect(() => {
    fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
  }, []);

  useEffect(() => {
    const url = selectedSubject ? `/api/leaderboard?subjectId=${selectedSubject}` : "/api/leaderboard";
    fetch(url).then((r) => r.json()).then(setRankings);
  }, [selectedSubject]);

  const getMedal = (i: number) => {
    if (i === 0) return "🥇";
    if (i === 1) return "🥈";
    if (i === 2) return "🥉";
    return "";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-gray-500">Top performing students</p>
        </div>
        <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="px-4 py-2 border rounded-lg">
          <option value="">All Subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {rankings.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center text-gray-500">
          No data yet. Start answering questions to appear on the leaderboard.
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-500 border-b">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Student</div>
            <div className="col-span-2 text-center">Correct</div>
            <div className="col-span-2 text-center">Total</div>
            <div className="col-span-2 text-center">Score</div>
          </div>
          {rankings.map((r, i) => (
            <div key={r.userId} className={`grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 items-center hover:bg-gray-50 ${i < 3 ? "bg-yellow-50/50" : ""}`}>
              <div className="col-span-1 text-lg">{getMedal(i) || <span className="text-gray-400 text-sm">{i + 1}</span>}</div>
              <div className="col-span-5">
                <Link to={`/user/${r.userId}`} className="font-medium hover:text-green-600 hover:underline">{r.name}</Link>
                <div className="text-xs text-gray-400">{r.email}</div>
              </div>
              <div className="col-span-2 text-center text-green-600 font-semibold">{r.correct}</div>
              <div className="col-span-2 text-center text-gray-600">{r.total}</div>
              <div className="col-span-2 text-center">
                <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${
                  r.percentage >= 80 ? "bg-green-100 text-green-700" :
                  r.percentage >= 50 ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>{r.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Want to top the chart?</h2>
        <p className="opacity-90 mb-4">Practice more past papers and improve your score</p>
        <Link to="/browse" className="inline-block bg-white text-green-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-100">
          Start Practicing
        </Link>
      </div>
    </div>
  );
}
