import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function ViewResult() {
  usePageTitle("Shared Result");
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/result/${id}`).then((r) => r.json()).then((d) => { if (d.error) setNotFound(true); else setResult(d); }).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <div className="max-w-md mx-auto px-4 py-16 text-center"><div className="text-5xl mb-3">❓</div><h1 className="text-xl font-bold mb-2">Result not found</h1><Link to="/quizzes" className="text-green-600 hover:underline">Browse quizzes</Link></div>;

  if (!result) return <div className="max-w-2xl mx-auto px-4 py-8">Loading result...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className={`text-center p-8 rounded-xl border shadow-sm mb-6 ${result.percentage >= 50 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <div className="text-5xl mb-3">{result.percentage >= 80 ? "🏆" : result.percentage >= 50 ? "🎉" : "💪"}</div>
        <h1 className="text-2xl font-bold mb-2">{result.userName || "Student"} scored <span className="text-green-600">{result.score}/{result.total}</span></h1>
        <p className="text-lg">({result.percentage}%)</p>
        <p className="text-sm text-gray-500 mt-2">{result.quizTitle}</p>
      </div>

      <div className="space-y-3 mb-6">
        {result.results?.map((r: any, i: number) => (
          <div key={i} className={`bg-white p-4 rounded-xl border shadow-sm ${r.isCorrect ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-400"}`}>
            <div className="flex justify-between mb-1">
              <span className="font-medium">Q{r.questionNumber}.</span>
              <span className={`text-xs px-2 py-0.5 rounded ${r.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.isCorrect ? "Correct" : "Incorrect"}</span>
            </div>
            <p className="text-sm text-gray-700 mb-1">{r.text}</p>
            {r.userAnswer && <p className="text-xs text-gray-500">Answer: {r.userAnswer}</p>}
            {!r.isCorrect && <p className="text-xs text-green-600 mt-1">Model: {r.modelAnswer}</p>}
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-400 mb-3">This is a shared result from JohnWeb</p>
        <Link to="/" className="text-green-600 hover:underline text-sm">Try JohnWeb yourself →</Link>
      </div>
    </div>
  );
}
