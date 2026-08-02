import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

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
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { isCorrect: boolean; feedback: string }>>({});

  const downloadPDF = () => window.print();

  useEffect(() => {
    fetch(`/api/papers/${id}`).then((r) => r.json()).then(setPaper);
    setToken(localStorage.getItem("token"));
  }, [id]);

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-sm text-green-600 font-semibold">Grade {paper.grade} | {paper.examType}</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{paper.title}</h1>
            <p className="text-gray-500">{paper.year} | {paper.description}</p>
          </div>
          <button onClick={downloadPDF} className="hidden sm:flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download PDF
          </button>
        </div>
      </div>

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
              <div className={`mt-3 p-3 rounded-lg ${results[q.id].isCorrect ? "bg-green-50 text-green-700 border border-green-200" : "bg-purple-50 text-purple-800 border border-purple-200"}`}>
                <p className="font-medium">{results[q.id].feedback}</p>
              </div>
            )}

            <details className="mt-3">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">View Model Answer</summary>
              {q.options && q.options.length > 0 ? (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  {q.options.map((opt: string, oi: number) => (
                    <div key={oi} className={`text-sm px-2 py-1 rounded ${opt === q.modelAnswer ? "text-green-700 font-semibold bg-green-50" : "text-gray-700"}`}>
                      {String.fromCharCode(65 + oi)}. {opt} {opt === q.modelAnswer && "✓"}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-700">{q.modelAnswer}</p>
              )}
            </details>
          </div>
        ))}
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
