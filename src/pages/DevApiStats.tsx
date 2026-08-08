import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function DevApiStats() {
  usePageTitle("API Stats");
  const [stats, setStats] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    fetch("/api/dev/stats", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setStats(d)))
      .catch(() => setErr("Could not load stats"));
  }, []);

  const pct = stats?.me?.answersSubmitted
    ? Math.round((stats.me.correctAnswers / stats.me.answersSubmitted) * 100)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">API Stats</h1>
      <p className="text-gray-500 mb-6">Live numbers from the JohnWeb library and your account.</p>

      {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">{err}</div>}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Subjects", value: stats?.library?.subjects, color: "text-green-600" },
          { label: "Papers", value: stats?.library?.papers, color: "text-blue-600" },
          { label: "Questions", value: stats?.library?.questions, color: "text-purple-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white p-5 rounded-xl border shadow-sm text-center">
            <div className={`text-4xl font-bold ${c.color}`}>{c.value ?? "…"}</div>
            <div className="text-sm text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Your usage</h3>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: "Answers submitted", value: stats.me.answersSubmitted },
              { label: "Correct", value: stats.me.correctAnswers },
              { label: "Accuracy", value: `${pct}%` },
              { label: "Papers viewed", value: stats.me.papersViewed },
            ].map((x) => (
              <div key={x.label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-2xl font-bold">{x.value}</div>
                <div className="text-xs text-gray-500 mt-1">{x.label}</div>
              </div>
            ))}
          </div>
        ) : <div className="text-sm text-gray-400">Loading…</div>}
        <div className="mt-4 text-xs text-gray-400">
          Account: {stats?.me?.name} · {stats?.me?.role} · plan <b>{stats?.me?.plan}</b>
          {stats?.apiKey ? " · 🔑 API key active" : " · no API key yet"}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-semibold mb-3">Rate limits</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          {stats ? (
            Object.entries(stats.rateLimits).map(([k, v]) => (
              <li key={k} className="flex justify-between"><span>{k}</span><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{v}</code></li>
            ))
          ) : (
            <li>Loading…</li>
          )}
          <li className="flex justify-between"><span>Public API</span><code className="bg-gray-100 px-2 py-0.5 rounded text-xs">no key needed</code></li>
        </ul>
      </div>
    </div>
  );
}