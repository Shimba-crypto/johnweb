import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function BulkImport() {
  usePageTitle("Bulk Import");
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [paperId, setPaperId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error || d.role !== "super_admin") navigate("/"); else setUser(d); })
      .catch(() => navigate("/"));
    fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
  }, [navigate]);

  const allPapers = subjects.flatMap((s) => (s.papers || []).map((p) => ({ ...p, subjectName: s.name })));
  const filteredPapers = allPapers.filter((p) => !subjectId || p.subjectId === subjectId);

  const doImport = async () => {
    if (!paperId || !text.trim()) return alert("Select a paper and paste questions first");
    setImporting(true);
    const t = localStorage.getItem("token");
    const res = await fetch("/api/admin/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ paperId, text }),
    });
    const data = await res.json();
    setImporting(false);
    if (data.error) alert(data.error);
    else { setResult(data); setText(""); }
  };

  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;

  const sample = `1. What is 45 + 27?
A) 62
B) 70
C) 72
D) 82
Answer: C
Marks: 2

2. Name the capital city of Zambia.
Answer: Lusaka
Marks: 2

3. Which gas do plants need for photosynthesis?
A) Oxygen
B) Carbon dioxide
C) Nitrogen
D) Hydrogen
Answer: B
Marks: 2`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Bulk Question Importer</h1>
      <p className="text-gray-500 mb-8">Paste real ECZ questions to add them all at once</p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setPaperId(""); }} className="w-full p-2 border rounded-lg">
            <option value="">All subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Paper (target)</label>
          <select value={paperId} onChange={(e) => setPaperId(e.target.value)} className="w-full p-2 border rounded-lg">
            <option value="">Select paper...</option>
            {filteredPapers.map((p) => <option key={p.id} value={p.id}>{p.subjectName} | {p.title} ({p.grade})</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Questions (paste here)</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 border rounded-lg font-mono text-sm min-h-[300px]"
          placeholder={sample}
        />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <button onClick={doImport} disabled={importing} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 font-medium">
          {importing ? "Importing..." : "📥 Import Questions"}
        </button>
        <button onClick={() => setText(sample)} className="text-sm text-gray-500 hover:text-gray-700">Load sample</button>
        <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700 ml-auto">← Admin</Link>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-green-800 mb-2">✅ {result.added} questions imported!</h3>
          <div className="max-h-48 overflow-y-auto">
            {result.questions.map((q: any, i: number) => (
              <div key={i} className="text-sm text-gray-700 py-1 border-b border-green-100">
                <span className="font-medium">Q{q.questionNumber}.</span> {q.text} <span className="text-xs text-green-600 ml-1">[{q.type}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-50 border rounded-xl p-4">
        <h3 className="font-semibold mb-2">📋 Format Guide</h3>
        <p className="text-sm text-gray-600 mb-2">Separate each question with a blank line. Use this format:</p>
        <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">{sample}</pre>
        <ul className="text-xs text-gray-500 mt-3 space-y-1">
          <li>• Options A) B) C) D) are optional — without them it's an open question</li>
          <li>• "Answer:" can be the letter (B) or the full text</li>
          <li>• "Marks:" is optional (defaults to 2)</li>
        </ul>
      </div>
    </div>
  );
}
