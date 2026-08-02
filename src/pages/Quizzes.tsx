import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Quizzes() {
  usePageTitle("Quizzes");
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/quizzes").then((r) => r.json()).then(setQuizzes);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Quizzes</h1>
      <p className="text-gray-500 mb-8">Test your knowledge with timed quizzes</p>

      <div className="grid md:grid-cols-2 gap-4">
        {quizzes.map((q) => (
          <Link key={q.id} to={`/quizzes/${q.id}`} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{q.title}</h3>
                {q.subject && <span className="text-xs text-green-600 font-medium">{q.subject}{q.grade ? ` | Grade ${q.grade}` : ""}</span>}
              </div>
              <span className="text-xs text-gray-400">{q.questionCount} questions</span>
            </div>
            {q.description && <p className="text-sm text-gray-500 mb-2">{q.description}</p>}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>By {q.createdBy}</span>
              <span>{q.timeLimit} min</span>
            </div>
          </Link>
        ))}
        {quizzes.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">No quizzes yet. Check back later!</p>}
      </div>
    </div>
  );
}
