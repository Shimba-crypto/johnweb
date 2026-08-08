import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Status() {
  usePageTitle("Status");
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState("");

  const load = () => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => (d.error ? setErr(d.error) : setData(d)))
      .catch(() => setErr("Could not reach the status API"));
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const siteList = data?.sites ? Object.values(data.sites) as any[] : [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">System Status</h1>
        <p className="text-gray-500">
          {err ? "Status unavailable" : data && siteList.length === 0 ? "Collecting data — first checks are on the way." : siteList.every((s: any) => s.lastOk) ? "✅ All systems operational" : "⚠️ Something needs attention"}
        </p>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-6">{err}</div>}

      <div className="space-y-4">
        {siteList.map((s: any) => {
          const maxChecks = Math.max(1, ...s.days.map((d: any) => d.checks));
          return (
            <div key={s.name} className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.lastOk ? "bg-green-500" : "bg-red-500"}`} />
                  <h3 className="font-semibold">{s.name}</h3>
                </div>
                <div className="text-sm">
                  {s.uptimePct !== null ? (
                    <span className={s.uptimePct >= 99 ? "text-green-600 font-semibold" : s.uptimePct >= 95 ? "text-amber-600 font-semibold" : "text-red-600 font-semibold"}>{s.uptimePct}% uptime</span>
                  ) : <span className="text-gray-400">no data</span>}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {s.totalChecks} checks · avg {s.lastMs !== null ? `${s.lastMs} ms` : "—"} · last check {s.lastCheckAt ? new Date(s.lastCheckAt).toLocaleString() : "—"}
              </p>
              <div className="flex items-end gap-1.5 h-16">
                {s.days.map((d: any, i: number) => {
                  const okPct = d.checks ? Math.round(((d.checks - d.fails) / d.checks) * 100) : 0;
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {d.checks ? `${okPct}% · ${d.date}` : "no checks"}
                      </div>
                      <div
                        className={`w-full rounded-t ${d.checks === 0 ? "bg-gray-200" : okPct === 100 ? "bg-green-500" : okPct >= 90 ? "bg-amber-400" : "bg-red-500"}`}
                        style={{ height: `${Math.max(4, Math.round((d.checks / maxChecks) * 100))}%`, opacity: i === s.days.length - 1 ? 1 : 0.8 }}
                      />
                      <span className="text-[8px] mt-0.5">{d.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-8">
        Checks run every 5 minutes from a dedicated monitor. Page auto-refreshes every minute.
      </p>
    </div>
  );
}