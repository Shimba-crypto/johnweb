import { useEffect, useMemo, useState } from "react";

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function BarChart({ data, label, accent }: { data: { label: string; value: number; sub?: string }[]; label: string; accent?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <h3 className="font-semibold text-sm mb-3">{label}</h3>
      <div className="flex items-end gap-1.5 h-28">
        {data.map((d, i) => {
          const h = Math.max(4, Math.round((d.value / max) * 100));
          const isToday = i === data.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] bg-gray-800 text-white rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                {d.value} {d.sub ? `· K${d.sub}` : ""}
              </div>
              <div
                className={`w-full rounded-t transition-all ${d.value === 0 ? "bg-gray-200" : "bg-green-600"}`}
                style={{ height: `${h}%`, opacity: isToday ? 1 : 0.75 }}
              />
              <span className={`text-[9px] mt-1 ${isToday ? "font-bold" : ""}`}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SalesCharts() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${t}` };
    Promise.all([
      fetch("/api/admin/invoices", { headers: h }).then((r) => r.json()),
      fetch("/api/admin/codes", { headers: h }).then((r) => r.json()),
      fetch("/api/users", { headers: h }).then((r) => r.json()),
    ])
      .then(([i, c, u]) => {
        if (Array.isArray(i)) setInvoices(i);
        if (Array.isArray(c)) setCodes(c);
        if (Array.isArray(u)) setUsers(u);
      })
      .catch(() => setErr("Could not load dashboard data."));
  }, []);

  const stats = useMemo(() => {
    const claims = invoices.flatMap((i) => (i.claims || []).map((c: any) => ({ ...c, invoiceTitle: i.title, code: i.code })));
    const revenue = claims.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const weekRevenue = claims.filter((c) => c.paidAt?.startsWith(weekAgo) || c.paidAt >= weekAgo).reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const redeemed = codes.filter((c) => c.status === "used").length;
    return { claims, revenue, weekRevenue, redeemed, sales: claims.length };
  }, [invoices, codes]);

  const salesByDay = useMemo(() => {
    const days = lastNDays(14).map((d) => ({ day: d, count: 0, revenue: 0 }));
    stats.claims.forEach((c) => {
      const day = (c.paidAt || "").slice(0, 10);
      const hit = days.find((x) => x.day === day);
      if (hit) { hit.count++; hit.revenue += Number(c.amount) || 0; }
    });
    return days.map((d) => ({ label: d.day.slice(5).replace("-", "/"), value: d.count, sub: d.revenue ? String(d.revenue) : "" }));
  }, [stats.claims]);

  const signupsByDay = useMemo(() => {
    const days = lastNDays(14).map((d) => ({ day: d, count: 0 }));
    users.forEach((u) => {
      const day = (u.createdAt || "").slice(0, 10);
      const hit = days.find((x) => x.day === day);
      if (hit) hit.count++;
    });
    return days.map((d) => ({ label: d.day.slice(5).replace("-", "/"), value: d.count }));
  }, [users]);

  const byPlan = useMemo(() => {
    const m = new Map<string, number>();
    stats.claims.forEach((c) => {
      const title = c.invoiceTitle || "Other";
      m.set(title, (m.get(title) || 0) + (Number(c.amount) || 0));
    });
    const rows = [...m.entries()].sort((a, b) => b[1] - a[1]);
    const max = Math.max(...rows.map(([, v]) => v), 1);
    return { rows, max };
  }, [stats.claims]);

  if (err) return <div className="text-red-600 text-sm">{err}</div>;
  if (!invoices.length && !codes.length && !users.length) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total revenue", value: `K${stats.revenue}`, icon: "💰" },
          { label: "Sales", value: String(stats.sales), icon: "🛒" },
          { label: "This week", value: `K${stats.weekRevenue}`, icon: "📅" },
          { label: "Codes redeemed", value: String(stats.redeemed), icon: "🎫" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="text-lg">{s.icon}</div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <BarChart data={salesByDay} label="Sales last 14 days (hover for revenue)" />
        <BarChart data={signupsByDay} label="New accounts last 14 days" />
      </div>

      {byPlan.rows.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3">Revenue by plan</h3>
          <div className="space-y-2">
            {byPlan.rows.map(([title, amount]) => (
              <div key={title} className="flex items-center gap-2">
                <span className="text-xs w-32 truncate">{title}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                  <div className="h-full bg-green-600 rounded" style={{ width: `${(amount / byPlan.max) * 100}%` }} />
                </div>
                <span className="text-xs font-medium w-14 text-right">K{amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.claims.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3">Recent sales</h3>
          <div className="space-y-1.5">
            {[...stats.claims].sort((a, b) => (b.paidAt || "").localeCompare(a.paidAt || "")).slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>💵 <b>{c.name}</b> ({c.phone}) — {c.invoiceTitle}</span>
                <span className="text-gray-500 text-xs">{c.paidAt?.slice(0, 16).replace("T", " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
