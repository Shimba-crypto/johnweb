import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

const ago = (iso: string | null) => {
  if (!iso) return "—";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function Status() {
  usePageTitle("Status");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");
  const [, setTick] = useState(0);

  const load = () => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch(() => setErr("Could not reach the status API"));
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 30 * 1000);
    const t2 = setInterval(() => setTick((n) => n + 1), 15 * 1000);
    return () => { clearInterval(t); clearInterval(t2); };
  }, []);

  const siteList: any[] = data?.sites ? Object.values(data.sites) : [];
  const totalChecks = siteList.reduce((a, s) => a + (s.totalChecks || 0), 0);
  const totalFails = siteList.reduce((a, s) => a + (s.totalFails ?? 0), 0);
  const allOk = siteList.length > 0 && siteList.every((s) => s.lastOk);
  const anyDown = siteList.some((s) => s.lastOk === false);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">System Status</h1>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {err ? (
            <span className="text-red-600 font-medium">Status unavailable</span>
          ) : siteList.length === 0 ? (
            <span className="text-gray-500">Collecting data — first checks are on the way.</span>
          ) : (
            <>
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${anyDown ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                <span className={`w-2 h-2 rounded-full ${anyDown ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                {anyDown ? "Issues detected" : allOk ? "All systems operational" : "Status unknown"}
              </span>
              {totalChecks > 0 && (
                <span className="text-xs text-gray-400">
                  {totalChecks} checks · {(100 - (totalFails / totalChecks) * 100).toFixed(1)}% uptime overall
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6">{err}</div>}

      <div className="space-y-4">
        {siteList.map((s: any) => {
          const maxChecks = Math.max(1, ...s.days.map((d: any) => d.checks));
          const last14 = s.days.slice(-14);
          const maxAvg = Math.max(1, ...last14.map((d: any) => d.avgMs ?? 0));
          const t = s.today;
          return (
            <div key={s.name} className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.lastOk === false ? "bg-red-500 animate-pulse" : s.lastOk ? "bg-green-500" : "bg-gray-300"}`} />
                  <h3 className="font-semibold truncate">{s.name}</h3>
                  {s.lastCode ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${s.lastOk === false ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                      http {s.lastCode}
                    </span>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  {t ? (
                    <div className={`text-lg leading-tight font-bold ${t.pct >= 99 ? "text-green-600" : t.pct >= 90 ? "text-amber-600" : "text-red-600"}`}>{t.pct}%</div>
                  ) : (
                    <div className="text-lg leading-tight font-bold text-gray-300">—</div>
                  )}
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">today</div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-2">
                Last check {ago(s.lastCheckAt)} · avg {s.lastMs !== null ? `${s.lastMs} ms` : "—"}
              </p>

              <div className="flex items-end gap-[3px] h-14 mb-1">
                {s.days.map((d: any, i: number) => {
                  const okPct = d.checks ? Math.round(((d.checks - d.fails) / d.checks) * 100) : 0;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                        {d.checks ? `${okPct}% up · ${d.checks} checks${d.avgMs ? ` · avg ${d.avgMs} ms` : ""} · ${d.date}` : `no checks · ${d.date}`}
                      </div>
                      <div
                        className={`w-full rounded-t transition-colors ${d.checks === 0 ? "bg-gray-200" : okPct === 100 ? "bg-green-500" : okPct >= 90 ? "bg-amber-400" : "bg-red-500"}`}
                        style={{ height: `${Math.max(4, Math.round((d.checks / maxChecks) * 100))}%`, opacity: i === s.days.length - 1 ? 1 : 0.75 }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-gray-300 mb-3">
                <span>{s.days[0]?.date.slice(5)}</span>
                <span>30 days</span>
                <span>today</span>
              </div>

              <div className="flex items-center gap-[3px] h-6">
                {last14.map((d: any) => (
                  <div key={d.date} className="flex-1 flex items-end h-full group relative">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                      {d.avgMs !== null ? `avg ${d.avgMs} ms · ${d.date}` : `no data · ${d.date}`}
                    </div>
                    <div
                      className={`w-full rounded-t ${d.avgMs === null ? "bg-gray-200" : "bg-blue-500"}`}
                      style={{ height: `${d.avgMs === null ? 4 : Math.max(8, Math.round((d.avgMs / maxAvg) * 100))}%`, opacity: 0.8 }}
                    />
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-gray-300 text-right mt-0.5">avg latency · last 14 days</div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Checks run every 5 minutes from a dedicated monitor. Page auto-refreshes every 30 seconds.
      </p>
    </div>
  );
}
