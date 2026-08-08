import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

const BASE = "https://johnweb-qncu.onrender.com";

export default function DevPapersApi() {
  usePageTitle("Papers API");
  const [mode, setMode] = useState<"browse" | "search">("browse");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [papers, setPapers] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    fetch(`${BASE}/api/public/subjects`)
      .then((r) => r.json())
      .then((d) => setSubjects(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!subjectId) { setPapers([]); return; }
    fetch(`${BASE}/api/public/subjects`)
      .then((r) => r.json())
      .then((d) => {
        const s = d.find((x: any) => x.id === subjectId);
        setPapers(s?.papers || []);
      })
      .catch(() => {});
  }, [subjectId]);

  const loadPaper = async (id: string) => {
    setSelected(null);
    const r = await fetch(`${BASE}/api/public/papers/${id}`);
    setSelected(await r.json());
    setCopied(false);
  };

  const doSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setSelected(null);
    try {
      const r = await fetch(`${BASE}/api/public/search?q=${encodeURIComponent(q)}`);
      setResults(await r.json());
    } catch { setResults(null); }
    setSearching(false);
  };

  const copy = async () => {
    if (!selected) return;
    try { await navigator.clipboard.writeText(JSON.stringify(selected, null, 2)); setCopied(true); } catch {}
  };

  const snippet = selected
    ? `const res = await fetch("${BASE}/api/public/papers/${selected.id}");
const paper = await res.json();
paper.questions.forEach((q) =>
  console.log(q.questionNumber, q.text, "->", q.modelAnswer)
);`
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">Papers API</h1>
      <p className="text-gray-500 mb-4">Browse the library or search it — preview exactly what the API returns. No key needed.</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setMode("browse")} className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === "browse" ? "bg-green-600 text-white" : "bg-white border text-gray-600"}`}>📚 Browse</button>
        <button onClick={() => setMode("search")} className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === "search" ? "bg-green-600 text-white" : "bg-white border text-gray-600"}`}>🔍 Search</button>
      </div>

      {mode === "browse" ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <label className="block text-sm font-medium mb-2">1. Pick a subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full p-2 border rounded-lg mb-4">
              <option value="">— choose subject —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.papers.length} papers)</option>
              ))}
            </select>

            <label className="block text-sm font-medium mb-2">2. Pick a paper</label>
            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
              {papers.length === 0 && <p className="text-sm text-gray-400">No papers yet.</p>}
              {papers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadPaper(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition ${selected?.id === p.id ? "bg-green-600 text-white border-green-600" : "hover:bg-gray-50 border-gray-200"}`}
                >
                  {p.title} <span className="text-xs opacity-70">({p.questionsCount} qs)</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white p-5 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{selected ? `3. ${selected.title} — live JSON` : "3. Response preview"}</h3>
              {selected && (
                <button onClick={copy} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-700">
                  {copied ? "✅ Copied" : "📋 Copy JSON"}
                </button>
              )}
            </div>
            {selected ? (
              <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto max-h-96">{JSON.stringify(selected, null, 2)}</pre>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-sm text-gray-400">
                Select a paper to see its full JSON — questions, options and model answers.
              </div>
            )}
            {snippet && (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-1">Use it in your app</h4>
                <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg text-xs overflow-x-auto">{snippet}</pre>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <label className="block text-sm font-medium mb-2">Search the library — GET /api/public/search?q=</label>
          <div className="flex gap-2 mb-4">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="e.g. photosynthesis, president, fraction…"
              className="flex-1 p-2 border rounded-lg text-sm"
            />
            <button onClick={doSearch} disabled={searching} className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {searching ? "Searching…" : "🔍 Search"}
            </button>
          </div>

          {results && (
            <>
              <h3 className="font-semibold mb-2">
                {results.papers.length + results.questions.length} hits for "{results.query}"
              </h3>
              {results.papers.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Papers ({results.papers.length})</h4>
                  <div className="space-y-1">
                    {results.papers.map((p: any) => (
                      <button key={p.id} onClick={() => { setMode("browse"); setSubjectId(p.subjectId); loadPaper(p.id); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">
                        📄 {p.title} <span className="text-xs text-gray-400">({p.questionsCount} qs)</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results.questions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Questions ({results.questions.length})</h4>
                  <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                    {results.questions.map((q: any) => (
                      <button key={q.id} onClick={() => loadPaper(q.paperId)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">
                        Q{q.questionNumber}: {q.text.slice(0, 120)}
                      </button>
                    ))}
                  </div>
                  {results.questions.length === 50 && <p className="text-xs text-gray-400 mt-2">Showing first 50 — narrow your search.</p>}
                </div>
              )}
              {results.papers.length === 0 && results.questions.length === 0 && (
                <p className="text-sm text-gray-400">No matches. Try a different word.</p>
              )}
            </>
          )}

          {selected && mode === "search" && (
            <div className="mt-5 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{selected.title} — live JSON</h3>
                <button onClick={copy} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-700">
                  {copied ? "✅ Copied" : "📋 Copy JSON"}
                </button>
              </div>
              <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto max-h-96">{JSON.stringify(selected, null, 2)}</pre>
              {snippet && (
                <>
                  <h4 className="text-sm font-semibold text-gray-700 mt-4 mb-1">Use it in your app</h4>
                  <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg text-xs overflow-x-auto">{snippet}</pre>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}