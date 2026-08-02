import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { navigate("/login"); return; }
    fetch("/api/bookmarks", { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).then(setBookmarks);
  }, [navigate]);

  const remove = async (questionId: string) => {
    const t = localStorage.getItem("token");
    await fetch(`/api/bookmarks/${questionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
    setBookmarks((prev) => prev.filter((b) => b.questionId !== questionId));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Saved Questions</h1>

      {bookmarks.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center text-gray-500">
          <div className="text-4xl mb-3">🔖</div>
          <p className="mb-2">No saved questions yet.</p>
          <Link to="/browse" className="text-green-600 hover:underline">Browse past papers</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((b) => (
            <div key={b.id} className="bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">{b.paper?.title || "?"}</div>
                  <p className="text-sm text-gray-800">{b.question?.text || "?"}</p>
                  {b.question?.modelAnswer && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-400 cursor-pointer">Model answer</summary>
                      <p className="text-sm text-green-700 mt-1">{b.question.modelAnswer}</p>
                    </details>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 ml-3 shrink-0">
                  {b.question && <Link to={`/paper/${b.question.paperId}`} className="text-xs text-green-600 hover:underline">Open</Link>}
                  <button onClick={() => remove(b.questionId)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
