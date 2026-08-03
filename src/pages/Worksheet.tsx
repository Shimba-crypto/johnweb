import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Worksheet() {
  usePageTitle("Practice Worksheets");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [grade, setGrade] = useState("7");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/subjects").then((r) => r.json()).then(setSubjects); }, []);

  const generate = async () => {
    setLoading(true); setQuestions([]);
    const res = await fetch("/api/papers?grade=" + grade);
    let papers = await res.json();
    if (subjectId) papers = papers.filter((p: any) => p.subjectId === subjectId);
    if (!papers.length) { setLoading(false); return; }
    const paper = papers[Math.floor(Math.random() * papers.length)];
    const p2 = await fetch(`/api/papers/${paper.id}`).then((r) => r.json());
    const shuffled = p2.questions.sort(() => Math.random() - 0.5).slice(0, count);
    setQuestions(shuffled.map((q: any) => ({ ...q, answerBlank: "" })));
    setLoading(false);
  };

  const print = () => window.print();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="no-print">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">🖨️ Practice Worksheet</h1>
            <p className="text-gray-500">Generate a printable worksheet with questions + answer key</p>
          </div>
          <Link to="/browse" className="text-sm text-green-600 hover:underline">← Back</Link>
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full p-2 border rounded-lg">
                <option value="">Any subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-2 border rounded-lg">
                {["6", "7", "9", "10", "12"].map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Questions</label>
              <select value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="w-full p-2 border rounded-lg">
                {[5, 10, 15, 20].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={generate} disabled={loading} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">{loading ? "Generating..." : "Generate Worksheet"}</button>
            {questions.length > 0 && <button onClick={print} className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-200">🖨️ Print / Save PDF</button>}
          </div>
        </div>
      </div>

      {questions.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="text-xl font-bold"><span className="text-green-600">John</span><span className="text-orange-500">Web</span></div>
            <div className="font-semibold mt-2">Practice Worksheet — Grade {grade}</div>
            <div className="text-xs text-gray-400">Name: ______________________ &nbsp;&nbsp; Date: ____________</div>
          </div>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id}>
                <p className="text-sm"><b>{i + 1}.</b> {q.text} <span className="text-xs text-gray-400">[{q.marks} marks]</span></p>
                {q.options?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-1 ml-6 mt-1 text-sm">
                    {q.options.map((o: string, oi: number) => <span key={oi}>{String.fromCharCode(65 + oi)}. {o}</span>)}
                  </div>
                ) : (
                  <div className="border-b border-dotted border-gray-300 ml-6 mt-3 h-8" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 pt-4 border-t no-print">
            <details>
              <summary className="text-sm text-gray-500 cursor-pointer">Answer key</summary>
              <div className="mt-2 text-sm text-gray-700">
                {questions.map((q, i) => <div key={q.id}><b>{i + 1}.</b> {q.modelAnswer || "—"}</div>)}
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
