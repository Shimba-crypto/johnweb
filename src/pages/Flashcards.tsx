import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Flashcards() {
  usePageTitle("Flashcards");
  const [cards, setCards] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { navigate("/login"); return; }
    fetch("/api/flashcards", { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).then(setCards);
  }, [navigate]);

  const card = cards[index];

  if (cards.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-3">🃏</div>
      <h1 className="text-xl font-bold mb-2">Flashcards</h1>
      <p className="text-gray-500 mb-4">Questions you got wrong are saved here for revision. Answer some questions wrong to build your deck!</p>
      <Link to="/browse" className="text-green-600 hover:underline">Browse papers</Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🃏 Flashcards</h1>
        <span className="text-sm text-gray-500">{index + 1}/{cards.length}</span>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm min-h-[240px] flex flex-col" style={{ perspective: "1000px" }}>
        <div onClick={() => setFlipped(!flipped)} className="flex-1 p-8 cursor-pointer flex flex-col justify-center" style={{ transform: flipped ? "rotateX(5deg)" : "none", transition: "transform 0.2s" }}>
          <div className="text-xs text-gray-400 mb-2">{card.paper || "Question"} · {card.marks} marks</div>
          {!flipped ? (
            <p className="text-lg text-gray-800">{card.text}</p>
          ) : (
            <div>
              {card.options && card.options.length > 0 && (
                <div className="space-y-1 mb-3">
                  {card.options.map((opt: string, i: number) => (
                    <div key={i} className={`text-sm p-2 rounded ${opt === card.modelAnswer ? "bg-green-50 text-green-700 font-semibold" : "text-gray-600"}`}>{String.fromCharCode(65 + i)}. {opt}</div>
                  ))}
                </div>
              )}
              <p className="text-green-700 font-medium">✅ {card.modelAnswer}</p>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center mt-4">Tap to {flipped ? "see question" : "reveal answer"}</p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => { setFlipped(false); setIndex((i) => (i === 0 ? cards.length - 1 : i - 1)); }}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium"
        >
          ← Previous
        </button>
        <button
          onClick={() => { setFlipped(false); setIndex((i) => (i + 1) % cards.length); }}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium"
        >
          Next →
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link to={`/paper/${card.paperId}`} className="text-sm text-green-600 hover:underline">Practice this paper →</Link>
      </div>
    </div>
  );
}
