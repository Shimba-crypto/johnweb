import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

const BASE = "https://johnweb-qncu.onrender.com";

function Card({ title, children, className = "" }: any) {
  return (
    <div className={`bg-white p-5 rounded-xl border shadow-sm ${className}`}>
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function DevDashboard() {
  usePageTitle("Developer Dashboard");
  const [stats, setStats] = useState<any>(null);
  const [conn, setConn] = useState<{ ms: number; ok: boolean } | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    fetch("/api/dev/stats", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setErr("Could not load stats"));
  }, []);

  const testConnection = async () => {
    const t0 = Date.now();
    try {
      const r = await fetch(`${BASE}/api/public/stats`);
      setConn({ ok: r.ok, ms: Date.now() - t0 });
    } catch {
      setConn({ ok: false, ms: Date.now() - t0 });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">Developer Dashboard</h1>
      <p className="text-gray-500 mb-6">
        Your free Developer plan — build apps on the JohnWeb API.{" "}
        <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-semibold">DEV · FREE FOREVER</span>
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card title="📚 Library" className="text-center">
          {stats ? (
            <>
              <div className="text-3xl font-bold text-green-600">{stats.library.papers}</div>
              <div className="text-sm text-gray-500">{stats.library.questions} questions across {stats.library.subjects} subjects</div>
            </>
          ) : err ? <div className="text-sm text-red-500">{err}</div> : <div className="text-sm text-gray-400">Loading…</div>}
        </Card>
        <Card title="📊 Your usage" className="text-center">
          {stats ? (
            <>
              <div className="text-3xl font-bold text-blue-600">{stats.me.answersSubmitted}</div>
              <div className="text-sm text-gray-500">answers submitted · {stats.me.correctAnswers} correct · {stats.me.papersViewed} papers viewed</div>
            </>
          ) : <div className="text-sm text-gray-400">Loading…</div>}
        </Card>
        <Card title="🔑 API key" className="text-center">
          {stats ? (
            stats.apiKey ? (
              <div className="text-sm text-gray-600">✅ Active key — use it in the <Link to="/dev/api-keys" className="text-cyan-600 font-medium hover:underline">API Keys</Link> page</div>
            ) : (
              <Link to="/dev/api-keys" className="inline-block mt-1 bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-700">
                Create your key
              </Link>
            )
          ) : <div className="text-sm text-gray-400">Loading…</div>}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card title="🚀 Quick start" className="md:col-span-2">
          <p className="text-sm text-gray-600 mb-3">Every endpoint is free, needs no login, and is open to any website or app (CORS allowed).</p>
          <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">{`fetch("${BASE}/api/public/stats")
  .then((r) => r.json())
  .then((d) => console.log(d.papers + " papers, " + d.questions + " questions"));`}</pre>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link to="/dev/api-keys" className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-700">🔑 API Keys</Link>
            <Link to="/dev/api-stats" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">📊 API Stats</Link>
            <Link to="/dev/papers-api" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">📚 Papers API</Link>
            <Link to="/dev/connect-app" className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">🔌 Connect App</Link>
            <Link to="/api-docs" className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">📖 API Docs</Link>
          </div>
        </Card>
      </div>

      <Card title="🩺 Connection test">
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={testConnection} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">
            Test the API now
          </button>
          {conn && (
            <span className={`text-sm font-medium ${conn.ok ? "text-green-600" : "text-red-600"}`}>
              {conn.ok ? `✅ API is up — ${conn.ms} ms` : `❌ Could not reach the API (${conn.ms} ms)`}
            </span>
          )}
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{BASE}</code>
        </div>
      </Card>
    </div>
  );
}