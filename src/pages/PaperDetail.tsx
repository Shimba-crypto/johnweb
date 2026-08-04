import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

interface Question {
  id: string;
  paperId: string;
  questionNumber: number;
  text: string;
  marks: number;
  modelAnswer: string;
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

export default function PaperDetail() {
  usePageTitle("Paper");
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { isCorrect: boolean; feedback: string }>>({});
  const [finished, setFinished] = useState<any>(null);
  const [finishing, setFinishing] = useState(false);
  const [paperFeedback, setPaperFeedback] = useState<{ text: string; loading: boolean }>({ text: "", loading: false });
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Refs keep the timer's auto-submit using the LATEST answers/results (no stale closures)
  const answersRef = useRef(answers);
  const resultsRef = useRef(results);
  const tokenRef = useRef(token);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { resultsRef.current = results; }, [results]);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const downloadPDF = () => window.print();

  const downloadOffline = () => {
    fetch(`/api/papers/${id}/offline`).then((r) => r.blob()).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${id}-offline.json`; a.click();
      URL.revokeObjectURL(url);
    });
  };

  useEffect(() => {
    fetch(`/api/papers/${id}`).then((r) => r.json()).then(setPaper);
    setToken(localStorage.getItem("token"));
  }, [id]);

  // Auto-start the timer as soon as the paper loads
  useEffect(() => {
    if (!paper || finished) return;
    const stored = localStorage.getItem(`exam-${id}`);
    if (stored) {
      try {
        const t = parseInt(stored, 10);
        if (t > Date.now() - 60 * 60 * 1000) { setStarted(true); setStartTime(t); return; }
        localStorage.removeItem(`exam-${id}`);
      } catch {}
    }
    const t = Date.now();
    setStarted(true);
    setStartTime(t);
    localStorage.setItem(`exam-${id}`, String(t));
  }, [paper, finished]);

  // 1 minute per question countdown
  useEffect(() => {
    if (!started || !paper || finished) return;
    const totalSeconds = paper.questions.length * 60;
    let interval: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      const remaining = totalSeconds - Math.floor((Date.now() - (startTime || Date.now())) / 1000);
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        if (interval) clearInterval(interval);
        finishPaperRef.current();
      }
    };
    tick();
    interval = setInterval(tick, 1000);
    return () => { if (interval) clearInterval(interval); };
  }, [started, paper, finished]);

  const finishPaperRef = useRef<() => void>(() => {});
  const finishingRef = useRef(false);
  useEffect(() => { finishPaperRef.current = finishPaper; });

  const finishPaper = async () => {
    const t = tokenRef.current;
    if (!t) { alert("Please login to finish the paper"); return; }
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    const latestAnswers = answersRef.current;
    const latestResults = resultsRef.current;
    // submit any answered-but-not-yet-submitted questions so results are accurate
    if (paper) {
      for (const q of paper.questions) {
        if (latestAnswers[q.id] && !latestResults[q.id] && latestAnswers[q.id].trim()) {
          await fetch("/api/answers", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
            body: JSON.stringify({ questionId: q.id, content: latestAnswers[q.id] }),
          }).catch(() => {});
        }
      }
    }
    const res = await fetch(`/api/papers/${id}/results`, { headers: { Authorization: `Bearer ${t}` } });
    const data = await res.json();
    setFinished(data);
    // fetch AI feedback
    setPaperFeedback({ text: "", loading: true });
    try {
      const fb = await fetch("/api/paper-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ title: data.title, results: data.results }),
      });
      const fbData = await fb.json();
      setPaperFeedback({ text: fbData.feedback || fbData.error || "Feedback unavailable.", loading: false });
    } catch {
      setPaperFeedback({ text: "Feedback unavailable.", loading: false });
    }
    setFinishing(false);
    finishingRef.current = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const tryAgain = () => {
    setFinished(null);
    setResults({});
    setAnswers({});
    setPaperFeedback({ text: "", loading: false });
    setStarted(false);
    setStartTime(null);
    localStorage.removeItem(`exam-${id}`);
  };

  const submitAnswer = async (questionId: string) => {
    if (!token) {
      alert("Please login to submit answers");
      return;
    }
    const res = await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ questionId, content: answers[questionId] || "" }),
    });
    if (res.ok) {
      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [questionId]: { isCorrect: data.isCorrect, feedback: data.isCorrect ? "Correct!" : "Incorrect. Check the model answer below." },
      }));
    }
  };

  if (!paper) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  if (finished) {
    const correct = finished.correct || 0;
    const attempted = finished.attempted || 0;
    const pct = attempted ? Math.round((correct / attempted) * 100) : 0;
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className={`text-center p-8 rounded-xl border shadow-sm mb-6 ${pct >= 50 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="text-5xl mb-3">{pct >= 80 ? "🏆" : pct >= 50 ? "🎉" : "💪"}</div>
          <h1 className="text-2xl font-bold mb-2">{finished.title}</h1>
          <p className="text-lg">You scored <strong>{correct}/{attempted}</strong> ({pct}%)</p>
          <p className="text-sm text-gray-500 mt-1">{attempted} of {finished.totalQuestions} questions answered</p>
        </div>

        <div className="space-y-3 mb-8">
          {finished.results?.map((r: any) => (
            <div key={r.questionId} className={`bg-white p-4 rounded-xl border shadow-sm ${r.answered && r.isCorrect ? "border-l-4 border-l-green-500" : r.answered ? "border-l-4 border-l-red-400" : "border-l-4 border-l-gray-300"}`}>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Q{r.questionNumber}.</span>
                <span className={`text-xs px-2 py-0.5 rounded ${r.answered && r.isCorrect ? "bg-green-100 text-green-700" : r.answered ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                  {!r.answered ? "Not answered" : r.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-1">{r.text}</p>
              {r.answered && <p className={`text-xs ${r.isCorrect ? "text-gray-500" : "text-red-600"}`}>Your answer: {r.userAnswer}</p>}
              {r.answered && !r.isCorrect && <p className="text-xs text-green-600 mt-1">Model answer: {r.modelAnswer}</p>}
            </div>
          ))}
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-purple-800 mb-2">🤖 AI Feedback</h3>
          {paperFeedback.loading ? (
            <p className="text-sm text-purple-600">Analyzing your answers...</p>
          ) : paperFeedback.text ? (
            <p className="text-sm text-purple-900 whitespace-pre-line">{paperFeedback.text}</p>
          ) : null}
        </div>

        <div className="text-center flex gap-3 justify-center">
          <button onClick={tryAgain} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">Try Again</button>
          <button onClick={downloadPDF} className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200">🖨️ Print</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-sm text-green-600 font-semibold">Grade {paper.grade} | {paper.examType}</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{paper.title}</h1>
            <p className="text-gray-500">{paper.year} | {paper.description}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={downloadOffline} className="hidden sm:flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 text-sm">
              📥 Offline
            </button>
            <button onClick={downloadPDF} className="hidden sm:flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className={`flex items-center justify-between gap-3 rounded-xl p-4 mb-8 border-2 ${timeLeft <= 60 ? "bg-red-600 border-red-700 text-white" : "bg-gradient-to-r from-orange-500 to-red-500 border-orange-600 text-white"}`}>
        <div>
          <div className="font-bold">⏱️ Time Remaining</div>
          <div className="text-sm opacity-95">{paper.questions.length} questions · 1 min each · auto-submits at 0</div>
        </div>
        <span className="bg-white px-4 py-2 rounded-lg font-bold text-lg tabular-nums text-gray-900">
          {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
        </span>
      </div>

      {(!paper.questions || paper.questions.length === 0) ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center text-yellow-800">
          <p className="font-medium">No questions found for this paper yet.</p>
          <p className="text-sm mt-1">The teacher hasn't added questions to this paper yet.</p>
        </div>
      ) : (
      <div className="space-y-6">
        {paper.questions.map((q) => (
          <div key={q.id} className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold">Question {q.questionNumber}</h3>
              <span className="text-sm text-gray-500">[{q.marks} marks]</span>
            </div>
            <p className="text-gray-800 mb-4">{q.text}</p>

            {q.options && q.options.length > 0 ? (
              <div className="space-y-2 mb-3">
                {q.options.map((opt: string, oi: number) => (
                  <label key={oi} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${answers[q.id] === opt ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className="accent-green-600"
                    />
                    <span className="text-sm">{String.fromCharCode(65 + oi)}. {opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                placeholder="Write your answer here..."
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                className="w-full p-3 border rounded-lg mb-3 min-h-[100px]"
              />
            )}

            <div className="flex gap-2 mb-3 flex-wrap">
              <button
                onClick={() => submitAnswer(q.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Submit Answer
              </button>
              <BookmarkButton questionId={q.id} />
              <button
                onClick={async () => {
                  const t = localStorage.getItem("token");
                  if (!t) return alert("Login to get AI feedback");
                  const myAnswer = answers[q.id] || "";
                  if (!myAnswer.trim()) return alert("Write your answer first, then get AI feedback.");
                  const res = await fetch("/api/ai-feedback", {
                    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                    body: JSON.stringify({ question: q.text, answer: myAnswer, modelAnswer: q.modelAnswer }),
                  });
                  const data = await res.json();
                  if (data.error) alert(data.error);
                  else {
                    setResults((prev) => ({ ...prev, [q.id]: { isCorrect: results[q.id]?.isCorrect || false, feedback: data.feedback } }));
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                🤖 AI Feedback
              </button>
            </div>

            {results[q.id] && (
              <div className={`mt-3 p-3 rounded-lg ${results[q.id].isCorrect ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                <p className="font-medium">{results[q.id].feedback}</p>
                {!results[q.id].isCorrect && answers[q.id] && (
                  <button
                    onClick={async () => {
                      const t = localStorage.getItem("token");
                      if (!t) return alert("Login first");
                      setResults((prev) => ({ ...prev, [q.id]: { ...prev[q.id], explaining: true } }));
                      const res = await fetch("/api/ai-feedback", {
                        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
                        body: JSON.stringify({ question: q.text, answer: answers[q.id], modelAnswer: q.modelAnswer, options: q.options, mode: "explain" }),
                      });
                      const data = await res.json();
                      setResults((prev) => ({ ...prev, [q.id]: { ...prev[q.id], feedback: data.feedback || data.error || "Explain unavailable", explaining: false } }));
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-200"
                  >
                    {results[q.id].explaining ? "Explaining..." : "💡 Explain why"}
                  </button>
                )}
              </div>
            )}

            {q.options && q.options.length > 0 && (
              <details className="mt-3">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">Check options</summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  Re-read the question carefully. Choose the best answer from A, B, C, or D.
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
      )}

      <div className="mt-8 border-t pt-6">
        <button
          onClick={finishPaper}
          disabled={finishing}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 text-lg"
        >
          {finishing ? "Checking your answers..." : "🏁 Finish Paper & See Results"}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">Submit your answers and get your score with AI feedback</p>
      </div>

      <Comments paperId={id || ""} />
    </div>
  );
}

function BookmarkButton({ questionId }: { questionId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) fetch(`/api/bookmarks/status/${questionId}`, { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).then((d) => setBookmarked(d.bookmarked));
  }, [questionId]);
  const toggle = async () => {
    const t = localStorage.getItem("token");
    if (!t) return alert("Login to bookmark");
    if (bookmarked) {
      await fetch(`/api/bookmarks/${questionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
      setBookmarked(false);
    } else {
      await fetch("/api/bookmarks", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ questionId }) });
      setBookmarked(true);
    }
  };
  return (
    <button onClick={toggle} className={`px-4 py-2 rounded-lg border ${bookmarked ? "bg-yellow-100 text-yellow-700 border-yellow-300" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
      {bookmarked ? "🔖 Saved" : "🔖 Save"}
    </button>
  );
}

function Comments({ paperId }: { paperId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const user = localStorage.getItem("user");
  useEffect(() => { fetch(`/api/comments/${paperId}`).then((r) => r.json()).then(setComments); }, [paperId]);

  const addComment = async () => {
    const token = localStorage.getItem("token");
    if (!token || !text.trim()) return;
    await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ paperId, content: text }) });
    setText("");
    fetch(`/api/comments/${paperId}`).then((r) => r.json()).then(setComments);
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Discussion ({comments.length})</h2>
      <div className="space-y-3 mb-4">
        {comments.map((c) => (
          <div key={c.id} className="bg-white p-3 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span className="font-medium text-gray-700">{c.userName}</span>
              <span>{new Date(c.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm">{c.content}</p>
          </div>
        ))}
      </div>
      {user && (
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question or share your answer..." className="flex-1 p-2 border rounded-lg text-sm" onKeyDown={(e) => e.key === "Enter" && addComment()} />
          <button onClick={addComment} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Post</button>
        </div>
      )}
    </div>
  );
}
