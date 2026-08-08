import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function DevAppBuilder() {
  usePageTitle("App Builder");
  const [apps, setApps] = useState<any[]>([]);
  const [appName, setAppName] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    fetch("/api/dev/apps", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setApps(Array.isArray(d) ? d : []))
      .catch(() => {});
  };
  useEffect(load, []);

  const submit = async () => {
    setMsg("");
    if (!appName.trim() || !appUrl.trim()) { setMsg("⚠️ App name and URL are required."); return; }
    const t = localStorage.getItem("token");
    const r = await fetch("/api/dev/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ appName: appName.trim(), appUrl: appUrl.trim(), description: description.trim() }),
    });
    const d = await r.json();
    if (d.error) { setMsg(`⚠️ ${d.error}`); return; }
    setMsg(`✅ ${d.message}`);
    setAppName(""); setAppUrl(""); setDescription("");
    load();
  };

  const statusChip = (s: string) =>
    s === "approved" ? "bg-green-100 text-green-700" : s === "rejected" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">App Builder</h1>
      <p className="text-gray-500 mb-6">
        Built something with the JohnWeb API? Register it — approved apps get a <b>🛠️ App Builder</b> badge and a link on your profile.
      </p>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4">{msg}</div>}

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <h3 className="font-semibold mb-3">Register your app</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">App name</label>
            <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="e.g. My Exam Trainer" className="w-full p-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">App URL (link to your app or repo)</label>
            <input value={appUrl} onChange={(e) => setAppUrl(e.target.value)} placeholder="https://…" className="w-full p-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">What does it do?</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="A quiz app for Grade 7 Maths using the public API…" className="w-full p-2 border rounded-lg text-sm" />
          </div>
          <button onClick={submit} className="bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-cyan-700">Submit for review</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-semibold mb-3">Your apps ({apps.length}/3)</h3>
        {apps.length === 0 ? (
          <p className="text-sm text-gray-400">No apps registered yet.</p>
        ) : (
          <div className="space-y-3">
            {apps.map((a) => (
              <div key={a.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm">{a.appName}</div>
                  <a href={a.appUrl} target="_blank" rel="noreferrer" className="text-xs text-cyan-600 hover:underline break-all">{a.appUrl}</a>
                  {a.description && <p className="text-xs text-gray-500 mt-1">{a.description}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">Submitted {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${statusChip(a.status)}`}>
                  {a.status === "approved" ? "✅ Approved" : a.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}