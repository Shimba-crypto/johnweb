import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function ViewQA() {
  usePageTitle("Question Bank");
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim().length >= 2) params.set("q", q);
    if (subject) params.set("subject", subject);
    const url = `/api/qa${params.toString() ? "?" + params.toString() : ""}`;
    fetch(url).then((r) => r.json()).then(setQuestions);
  }, [q, subject]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">📖 Question Bank</h1>
      <p className="text-gray-500 mb-6">Browse ECZ questions with model answers — no login needed</p>

      <div className="flex gap-2 mb-6">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions... (e.g. fractions)" className="flex-1 p-2 border rounded-lg" />
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="p-2 border rounded-lg">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {questions.length === 0 && <p className="text-center text-gray-500 py-8">No questions found.</p>}

      <div className="space-y-3">
        {questions.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-gray-500">{item.subject} · Grade {item.grade} · {item.paper}</div>
              <button onClick={() => setOpen(open === item.id ? null : item.id)} className="text-xs text-green-600 hover:underline">{open === item.id ? "Hide answer" : "View answer"}</button>
            </div>
            <p className="text-gray-800">{item.text}</p>
            {item.options && item.options.length > 0 && (
              <div className="mt-2 space-y-1">
                {item.options.map((opt: string, i: number) => (
                  <div key={i} className="text-sm text-gray-600 pl-2 border-l-2 border-gray-200">{String.fromCharCode(65 + i)}. {opt}</div>
                ))}
              </div>
            )}
            {open === item.id && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                ✅ Model answer: {item.modelAnswer}
              </div>
            )}
            <Link to={`/view/unknown/paper/${item.paperId}`} className="text-xs text-gray-400 hover:text-green-600 mt-1 inline-block">Open paper →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
