import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function EditPaper() {
  usePageTitle("Edit Paper");
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [paperId, setPaperId] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [saved, setSaved] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error || !["super_admin", "omni_super", "admin", "teacher"].includes(d.role)) navigate("/"); else setUser(d); })
      .catch(() => navigate("/"));
    fetch("/api/subjects").then((r) => r.json()).then((s) => { setSubjects(s); setPapers(s.flatMap((x: any) => x.papers || [])); });
  }, [navigate]);

  const loadPaper = async (pid: string) => {
    setPaperId(pid);
    setSaved("");
    if (!pid) { setQuestions([]); return; }
    const res = await fetch(`/api/papers/${pid}`);
    const data = await res.json();
    setQuestions(data.questions || []);
  };

  const updateQ = (i: number, field: string, value: any) => {
    setQuestions((prev) => prev.map((q, j) => (j === i ? { ...q, [field]: value } : q)));
  };

  const saveAll = async () => {
    const t = localStorage.getItem("token");
    const res = await fetch(`/api/admin/papers/${paperId}/questions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ questions: questions.map((q) => ({ id: q.id, text: q.text, marks: q.marks, modelAnswer: q.modelAnswer, options: q.options || [] })) }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else setSaved(`Saved ${data.updated} questions`);
  };

  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;

  const paper = papers.find((p) => p.id === paperId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">✏️ Edit Paper</h1>
          <p className="text-gray-500">Bulk-edit all questions on a paper</p>
        </div>
        <Link to="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select a paper</label>
        <select value={paperId} onChange={(e) => loadPaper(e.target.value)} className="w-full p-2 border rounded-lg">
          <option value="">Choose paper...</option>
          {papers.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {paper && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Editing: <strong>{paper.title}</strong> · {questions.length} questions
        </div>
      )}

      {questions.length > 0 && (
        <>
          <div className="space-y-4 mb-6">
            {questions.map((q, i) => (
              <div key={q.id || i} className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Q{i + 1}</span>
                  <input type="number" value={q.marks} onChange={(e) => updateQ(i, "marks", parseInt(e.target.value) || 0)} className="w-20 p-1 border rounded text-sm" min="0" />
                </div>
                <textarea value={q.text} onChange={(e) => updateQ(i, "text", e.target.value)} className="w-full p-2 border rounded-lg text-sm mb-2" rows={2} />
                <textarea value={q.options?.join(", ") || ""} onChange={(e) => updateQ(i, "options", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} placeholder="Options (comma-separated) — leave empty for open question" className="w-full p-2 border rounded-lg text-sm mb-2" rows={1} />
                <textarea value={q.modelAnswer || ""} onChange={(e) => updateQ(i, "modelAnswer", e.target.value)} placeholder="Model answer" className="w-full p-2 border rounded-lg text-sm" rows={1} />
              </div>
            ))}
          </div>
          <button onClick={saveAll} className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 text-lg">💾 Save All Questions</button>
          {saved && <p className="text-green-600 text-center mt-2">{saved}</p>}
        </>
      )}
    </div>
  );
}
