import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const user = localStorage.getItem("user");

  useEffect(() => {
    fetch(`/api/quizzes/${id}`).then((r) => r.json()).then((q) => {
      setQuiz(q);
      setTimeLeft((q.timeLimit || 30) * 60);
    });
  }, [id]);

  useEffect(() => {
    if (!quiz || result) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [quiz, timeLeft, result]);

  const handleSubmit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    const token = localStorage.getItem("token");
    if (!token) return alert("Login to submit");
    const formatted = Object.entries(answers).map(([questionId, content]) => ({ questionId, content }));
    const res = await fetch(`/api/quizzes/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ answers: formatted }),
    });
    const data = await res.json();
    setResult(data);
    setSubmitting(false);
  };

  if (!quiz) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className={`text-center p-8 rounded-xl border shadow-sm mb-6 ${result.percentage >= 50 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="text-5xl mb-3">{result.percentage >= 50 ? "🎉" : "💪"}</div>
          <h1 className="text-2xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-lg">You scored <strong>{result.score}/{result.total}</strong> ({result.percentage}%)</p>
          <p className="text-sm text-gray-500 mt-1">{result.quizTitle}</p>
        </div>
        <div className="space-y-3">
          {result.results?.map((r: any, i: number) => (
            <div key={i} className={`bg-white p-4 rounded-xl border shadow-sm ${r.isCorrect ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-400"}`}>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Q{r.questionNumber}.</span>
                <span className={`text-xs px-2 py-0.5 rounded ${r.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.isCorrect ? "Correct" : "Incorrect"}</span>
              </div>
              <p className="text-sm text-gray-700 mb-1">{r.text}</p>
              {r.userAnswer && <p className="text-xs text-gray-500">Your answer: {r.userAnswer}</p>}
              {!r.isCorrect && <p className="text-xs text-green-600 mt-1">Model answer: {r.modelAnswer}</p>}
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              const text = `I scored ${result.score}/${result.total} (${result.percentage}%) on "${result.quizTitle}" on JohnWeb! 🇿🇲 Try it: https://johnweb-qncu.onrender.com`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600"
          >
            📲 Share on WhatsApp
          </button>
          <Link to="/quizzes" className="text-green-600 hover:underline">Back to Quizzes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{quiz.title}</h1>
          <p className="text-gray-500 text-sm">{quiz.description}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-orange-600">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</div>
          <div className="text-xs text-gray-400">{quiz.questions.length} questions</div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {quiz.questions?.map((q: any) => (
          <div key={q.id} className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Question {q.questionNumber}</h3>
              <span className="text-sm text-gray-400">[{q.marks} marks]</span>
            </div>
            <p className="text-gray-800 mb-3">{q.text}</p>
            {q.options && q.options.length > 0 ? (
              <div className="space-y-2">
                {q.options.map((opt: string, oi: number) => (
                  <label key={oi} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${answers[q.id] === opt ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"}`}>
                    <input type="radio" name={`qz-${q.id}`} value={opt} checked={answers[q.id] === opt} onChange={() => setAnswers((p) => ({ ...p, [q.id]: opt }))} className="accent-green-600" />
                    <span className="text-sm">{String.fromCharCode(65 + oi)}. {opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                placeholder="Your answer..."
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                className="w-full p-3 border rounded-lg min-h-[80px]"
              />
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 text-lg"
      >
        {submitting ? "Submitting..." : "Submit Quiz"}
      </button>
    </div>
  );
}
