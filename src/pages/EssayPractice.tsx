import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

const TOPICS = [
  { title: "The role of young people in promoting national unity in Zambia", words: 350 },
  { title: "My best friend", words: 250 },
  { title: "How I spent my last school holiday", words: 300 },
  { title: "The importance of education in my life", words: 300 },
  { title: "A day I will never forget", words: 250 },
  { title: "The dangers of drug abuse", words: 300 },
  { title: "Why we should keep our environment clean", words: 300 },
  { title: "My future career", words: 300 },
];

export default function EssayPractice() {
  usePageTitle("AI Essay Practice");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState(TOPICS[0].title);
  const [essay, setEssay] = useState("");
  const [grading, setGrading] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return navigate("/login");
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) navigate("/login"); else setUser(d); });
  }, [navigate]);

  const grade = async () => {
    const t = localStorage.getItem("token");
    if (!essay.trim()) return setError("Write your essay first.");
    setLoading(true); setError(""); setGrading("");
    const res = await fetch("/api/ai-essay", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ title, essay }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) setError(data.error);
    else setGrading(data.grading);
  };

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  const words = essay.trim() ? essay.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">✍️ AI Essay Practice</h1>
          <p className="text-gray-500">Write a composition and get it graded like an ECZ English examiner (out of 20)</p>
        </div>
        <Link to="/browse" className="text-sm text-green-600 hover:underline">← Back</Link>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-5 mb-4">
        <label className="block text-sm font-medium mb-1">Composition title</label>
        <select value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded-lg mb-3">
          {TOPICS.map((t) => <option key={t.title} value={t.title}>{t.title}</option>)}
        </select>
        <label className="block text-sm font-medium mb-1">Your essay <span className="text-gray-400">({words} words)</span></label>
        <textarea
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder="Write your composition here..."
          className="w-full p-3 border rounded-lg min-h-[240px]"
        />
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        <button onClick={grade} disabled={loading} className="mt-3 bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50">
          {loading ? "🤖 Grading..." : "🤖 Grade My Essay"}
        </button>
      </div>

      {grading && (
        <div className="bg-white rounded-xl border shadow-sm p-5">
          <h2 className="font-semibold mb-2">📊 AI Examiner Report</h2>
          <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">{grading}</pre>
        </div>
      )}
    </div>
  );
}
