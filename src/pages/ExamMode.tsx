import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

interface Question {
  id: string;
  paperId: string;
  questionNumber: number;
  text: string;
  marks: number;
  modelAnswer: string;
  options?: string[];
}

interface Paper {
  id: string;
  title: string;
  year: number;
  grade: string;
  examType: string;
  description: string;
  questions: Question[];
}

interface Result {
  isCorrect: boolean;
  feedback: string;
  modelAnswer: string;
}

export default function ExamMode() {
  usePageTitle("Exam Mode");
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [phase, setPhase] = useState<"intro" | "exam" | "done">("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [ai, setAi] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`/api/papers/${id}`).then((r) => r.json()).then(setPaper);
  }, [id]);

  const duration = paper ? Math.min(3600, Math.max(600, paper.questions.length * 60)) : 600;

  useEffect(() => {
    if (phase !== "exam" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase === "exam" && timeLeft === 0) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase]);

  const start = () => { setTimeLeft(duration); setPhase("exam"); };

  const answerFor = (q: Question) => answers[q.id] || "";

  const submit = async () => {
    if (!token) { alert("Please login to take an exam"); return; }
    setSubmitting(true);
    const pending = paper!.questions.map(async (q) => {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId: q.id, content: answerFor(q) }),
      });
      const data = await res.json();
      return { q, data };
    });
    const settled = await Promise.all(pending);
    const r: Record<string, Result> = {};
    settled.forEach(({ q, data }) => {
      r[q.id] = { isCorrect: data.isCorrect, feedback: data.isCorrect ? "Correct!" : "Incorrect — see the model answer below.", modelAnswer: q.modelAnswer };
    });
    setResults(r);
    setSubmitting(false);
    setPhase("done");
  };

  const getAi = async (q: Question) => {
    const t = localStorage.getItem("token");
    if (!t) return;
    setAiLoading((p) => ({ ...p, [q.id]: true }));
    const res = await fetch("/api/ai-feedback", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ question: q.text, answer: answerFor(q), modelAnswer: q.modelAnswer }),
    });
    const data = await res.json();
    setAi((p) => ({ ...p, [q.id]: data.feedback || data.error || "AI unavailable" }));
    setAiLoading((p) => ({ ...p, [q.id]: false }));
  };

  if (!paper) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  const correctCount = Object.values(results).filter((r) => r.isCorrect).length;

  // ── Intro ──
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6">
            <div className="text-sm opacity-80 font-medium">Grade {paper.grade} | {paper.examType}</div>
            <h1 className="text-2xl font-bold mt-1">{paper.title}</h1>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-xl"><div className="text-xl font-bold text-gray-800">{paper.questions.length}</div><div className="text-xs text-gray-500">Questions</div></div>
              <div className="p-3 bg-gray-50 rounded-xl"><div className="text-xl font-bold text-gray-800">{Math.round(duration / 60)} min</div><div className="text-xs text-gray-500">Time Limit</div></div>
              <div className="p-3 bg-gray-50 rounded-xl"><div className="text-xl font-bold text-gray-800">{paper.questions.reduce((s, q) => s + q.marks, 0)}</div><div className="text-xs text-gray-500">Total Marks</div></div>
            </div>
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className="mb-2">📋 Instructions:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-500">
                <li>Answer all questions within the time limit.</li>
                <li>For multiple-choice, select the best option.</li>
                <li>Answers are auto-graded when you submit.</li>
                <li>The timer auto-submits when it reaches zero.</li>
              </ul>
            </div>
            <button onClick={start} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-700 transition">
              ▶ Start Exam
            </button>
            <Link to={`/paper/${paper.id}`} className="block text-center text-sm text-gray-400 hover:text-gray-600">← Back to practice mode</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Exam ──
  if (phase === "exam") {
    const q = paper.questions[idx];
    const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const ss = String(timeLeft % 60).padStart(2, "0");
    const answered = Object.keys(answers).length;
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border shadow-sm sticky top-16 z-10 p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-medium text-gray-600">Question {q.questionNumber} of {paper.questions.length}</div>
            <div className={`font-mono font-bold text-lg px-3 py-1 rounded-lg ${timeLeft < 120 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>{mm}:{ss}</div>
          </div>
          <div className="flex gap-1 mt-2 overflow-x-auto">
            {paper.questions.map((p, i) => (
              <button key={p.id} onClick={() => setIdx(i)}
                className={`w-7 h-7 shrink-0 rounded text-xs font-medium ${answers[p.id] ? "bg-green-600 text-white" : i === idx ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>
                {p.questionNumber}
              </button>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-2">{answered}/{paper.questions.length} answered</div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg">Question {q.questionNumber}</h3>
            <span className="text-sm text-gray-500">[{q.marks} marks]</span>
          </div>
          <p className="text-gray-800 mb-4">{q.text}</p>

          {q.options && q.options.length > 0 ? (
            <div className="space-y-2 mb-4">
              {q.options.map((opt: string, oi: number) => (
                <label key={oi} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${answerFor(q) === opt ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}>
                  <input type="radio" name={`q-${q.id}`} value={opt} checked={answerFor(q) === opt} onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} className="accent-green-600" />
                  <span className="text-sm">{String.fromCharCode(65 + oi)}. {opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea value={answerFor(q)} onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))} placeholder="Write your answer..." className="w-full p-3 border rounded-lg min-h-[120px] mb-4" />
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40">← Previous</button>
              <button onClick={() => setIdx((i) => Math.min(paper.questions.length - 1, i + 1))} className="px-4 py-2 rounded-lg border text-sm">Next →</button>
            </div>
            <button onClick={submit} disabled={submitting} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
              {submitting ? "Grading..." : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Results ──
  const pct = Math.round((correctCount / paper.questions.length) * 100);
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6 text-center">
        <div className="text-5xl mb-2">{pct >= 80 ? "🏆" : pct >= 50 ? "🎉" : "📚"}</div>
        <h1 className="text-2xl font-bold">{paper.title}</h1>
        <div className="text-gray-500 text-sm mt-1">{paper.questions.length} questions · {correctCount} correct</div>
        <div className="text-4xl font-bold text-green-600 my-3">{pct}%</div>
        <p className="text-sm text-gray-500">{pct >= 80 ? "Excellent work!" : pct >= 50 ? "Good effort — keep practicing!" : "Review the model answers and try again."}</p>
        <div className="flex gap-2 justify-center mt-4 flex-wrap">
          <Link to={`/paper/${paper.id}`} className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium">Practice Mode</Link>
          <button onClick={() => { setPhase("exam"); setAnswers({}); setResults({}); setAi({}); setTimeLeft(duration); }} className="px-5 py-2 rounded-lg border font-medium">Retake Exam</button>
        </div>
      </div>

      <div className="space-y-4">
        {paper.questions.map((q) => {
          const r = results[q.id];
          return (
            <div key={q.id} className={`bg-white rounded-xl border shadow-sm p-5 ${r?.isCorrect ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-400"}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500">Question {q.questionNumber} [{q.marks} marks]</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${r?.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r?.isCorrect ? "Correct" : "Incorrect"}</span>
              </div>
              <p className="text-gray-800 mb-2">{q.text}</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
                <div className="bg-gray-50 p-3 rounded-lg"><span className="text-xs text-gray-400 block">Your answer</span><span className="text-gray-700">{answerFor(q) || "—"}</span></div>
                <div className="bg-green-50 p-3 rounded-lg"><span className="text-xs text-green-600 block">Model answer</span><span className="text-gray-700">{q.modelAnswer || "—"}</span></div>
              </div>
              <button onClick={() => getAi(q)} disabled={aiLoading[q.id]} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 disabled:opacity-50">
                {aiLoading[q.id] ? "Thinking..." : "🤖 Explain this answer"}
              </button>
              {ai[q.id] && <div className="mt-2 p-3 bg-purple-50 border border-purple-100 rounded-lg text-sm text-purple-900">{ai[q.id]}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
