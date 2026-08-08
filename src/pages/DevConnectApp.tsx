import { useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

const BASE = "https://johnweb-qncu.onrender.com";

const LANGS = ["JavaScript", "Python", "cURL"] as const;
type Lang = (typeof LANGS)[number];

export default function DevConnectApp() {
  usePageTitle("Connect App");
  const [lang, setLang] = useState<Lang>("JavaScript");
  const [result, setResult] = useState<{ ok: boolean; ms: number; data: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    const t0 = Date.now();
    try {
      const r = await fetch(`${BASE}/api/public/stats`);
      const d = await r.json();
      setResult({ ok: r.ok, ms: Date.now() - t0, data: JSON.stringify(d, null, 2) });
    } catch {
      setResult({ ok: false, ms: Date.now() - t0, data: "Network error — check your connection." });
    }
    setTesting(false);
  };

  const snippet = {
    JavaScript: `const res = await fetch("${BASE}/api/public/papers?grade=7");
const papers = await res.json();
console.log(papers);`,
    Python: `import requests

papers = requests.get(
    "${BASE}/api/public/papers",
    params={"grade": "7"},
).json()
for p in papers:
    print(p["title"], "-", p["questionsCount"], "questions")`,
    cURL: `curl "${BASE}/api/public/papers?grade=7"`,
  }[lang];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">Connect your App</h1>
      <p className="text-gray-500 mb-6">Plug JohnWeb's papers into any website, app or school project.</p>

      <div className="space-y-4">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-1">1. It's free and open</h3>
          <p className="text-sm text-gray-600 mb-3">
            No account, no key, no login for the public API. Any website can call it (CORS is open) — including apps like CooperWeb.
          </p>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{BASE}</code>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">2. Try it live</h3>
          <button
            onClick={runTest}
            disabled={testing}
            className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {testing ? "Testing…" : "🚀 Test connection"}
          </button>
          {result && (
            <div className="mt-3">
              <div className={`text-sm font-medium mb-2 ${result.ok ? "text-green-600" : "text-red-600"}`}>
                {result.ok ? `✅ Connected in ${result.ms} ms` : "❌ Could not connect"}
              </div>
              <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">{result.data}</pre>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-3">3. Grab papers in your code</h3>
          <div className="flex gap-2 mb-3">
            {LANGS.map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${lang === l ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">{snippet}</pre>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-2">4. Full instructions</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
            <li>List everything: <code className="bg-gray-100 px-1 rounded">/api/public/stats</code> — subjects, papers, questions counts</li>
            <li>Get subjects + their papers: <code className="bg-gray-100 px-1 rounded">/api/public/subjects</code></li>
            <li>Filtered paper list: <code className="bg-gray-100 px-1 rounded">/api/public/papers?subjectId=&amp;grade=&amp;year=</code></li>
            <li>One full paper: <code className="bg-gray-100 px-1 rounded">/api/public/papers/:id</code> — includes questions, options and model answers</li>
            <li>Full docs with examples: <a href="/api-docs" className="text-cyan-600 font-medium hover:underline">/api-docs</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}