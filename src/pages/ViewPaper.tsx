import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function ViewPaper() {
  usePageTitle("View Paper");
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/papers/${id}`).then((r) => r.json()).then(setPaper).catch(() => setPaper(null));
  }, [id]);

  if (!paper) return <div className="max-w-3xl mx-auto px-4 py-8">Loading paper...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-green-600 font-semibold">Grade {paper.grade} | {paper.examType}</div>
          <h1 className="text-2xl font-bold">{paper.title}</h1>
          <p className="text-gray-500 text-sm">{paper.year} · {paper.description}</p>
        </div>
        <Link to={`/paper/${paper.id}`} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 shrink-0">Practice this paper →</Link>
      </div>

      <p className="text-xs text-gray-400 mb-4">📖 Read-only view — no answers shown. Click "Practice this paper" to attempt it.</p>

      <div className="space-y-4">
        {paper.questions?.map((q: any) => (
          <div key={q.id} className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">Question {q.questionNumber}</h3>
              <span className="text-sm text-gray-400">[{q.marks} marks]</span>
            </div>
            <p className="text-gray-800 mb-3">{q.text}</p>
            {q.options && q.options.length > 0 && (
              <div className="space-y-1.5">
                {q.options.map((opt: string, oi: number) => (
                  <div key={oi} className="p-2 rounded-lg border border-gray-200 text-sm text-gray-700">{String.fromCharCode(65 + oi)}. {opt}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
