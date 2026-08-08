import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function DevApiStats() {
  usePageTitle("API Stats");
  const [stats, setStats] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${t}` };
    fetch("/api/dev/stats", { headers: h })
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setStats(d)))
      .catch(() => setErr("Could not load stats"));
    fetch("/api/dev/usage", { headers: h })
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setUsage(d)))
      .catch(() => {});
  }, []);

  const pct = stats?.me?.answersSubmitted
    ? Math.round((stats.me.correctAnswers / stats.me.answersSubmitted) * 100)
    : 0;

  const maxDay = Math.max(1, ...(usage?.last14Days || []).map((d: any) => d.count));

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

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <h3 className="font-semibold mb-3">API usage — last 14 days</h3>
        {usage ? (
          <>
            <div className="flex items-end gap-1.5 h-28 mb-4">
              {usage.last14Days.map((d: any, i: number) => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                    {d.count} req · {d.date}
                  </div>
                  <div
                    className={`w-full rounded-t transition-all ${d.count === 0 ? "bg-gray-200" : "bg-cyan-600"}`}
                    style={{ height: `${Math.max(4, Math.round((d.count / maxDay) * 100))}%`, opacity: i === usage.last14Days.length - 1 ? 1 : 0.75 }}
                  />
                  <span className="text-[9px] mt-1">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Today</h4>
                <div className="text-3xl font-bold text-cyan-600">{usage.todayCount} <span className="text-sm font-normal text-gray-400">requests</span></div>
                <p className="text-xs text-gray-400 mt-1">Rate limit: {usage.limitPerMinute} req/min per IP</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Top endpoints today</h4>
                {usage.topPaths.length === 0 ? (
                  <p className="text-sm text-gray-400">No requests recorded yet.</p>
                ) : (
                  <ul className="text-sm space-y-1">
                    {usage.topPaths.map((p: any) => (
                      <li key={p.path} className="flex justify-between"><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{p.path}</code><span className="font-medium">{p.count}</span></li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        ) : <div className="text-sm text-gray-400">Loading…</div>}
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