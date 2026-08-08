import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function DevApiKeys() {
  usePageTitle("API Keys");
  const [key, setKey] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [testResult, setTestResult] = useState<string>("");

  const load = () => {
    const t = localStorage.getItem("token");
    fetch("/api/dev/api-key", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setKey(d.key ? d : null))
      .catch(() => {});
  };
  useEffect(load, []);

  const create = async () => {
    const t = localStorage.getItem("token");
    const r = await fetch("/api/dev/api-key", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    const d = await r.json();
    if (d.error) { setMsg(d.error); return; }
    setMsg(`✅ ${d.message}`);
    load();
  };

  const revoke = async () => {
    if (!confirm("Revoke this API key? Any app using it will stop working.")) return;
    const t = localStorage.getItem("token");
    const r = await fetch("/api/dev/api-key", { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
    const d = await r.json();
    setMsg(`✅ ${d.message}`);
    setKey(null);
    setShow(false);
  };

  const copy = () => {
    if (!key) return;
    navigator.clipboard?.writeText(key.key);
    setMsg("📋 Key copied to clipboard!");
  };

  const testKey = async () => {
    if (!key) return;
    const r = await fetch("/api/dev/me", { headers: { Authorization: `Bearer ${key.key}` } });
    const d = await r.json();
    setTestResult(d.authenticatedWith === "api_key" ? `✅ Key works! You are ${d.name} (${d.role}, ${d.plan} plan)` : `❌ ${d.error || "Failed"}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-1">API Keys</h1>
      <p className="text-gray-500 mb-6">Your private key for calling JohnWeb's developer endpoints.</p>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-3 rounded-lg mb-4">{msg}</div>}

      {!key && (
        <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
          <h3 className="font-semibold mb-2">Create your first API key</h3>
          <p className="text-sm text-gray-600 mb-4">
            The key identifies you when you call authenticated developer endpoints (like <code className="bg-gray-100 px-1 rounded">/api/dev/me</code>).
            You can always revoke it and make a new one.
          </p>
          <button onClick={create} className="bg-cyan-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-cyan-700">
            🔑 Generate API key
          </button>
        </div>
      )}

      {key && (
        <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
          <h3 className="font-semibold mb-2">Your API key</h3>
          <div className="flex items-center gap-2 mb-4">
            <code className="flex-1 bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">
              {show ? key.key : "devkey_••••••••••••••••••••••••••"}
            </code>
            <button onClick={() => setShow(!show)} className="bg-gray-100 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 shrink-0">{show ? "Hide" : "Show"}</button>
            <button onClick={copy} className="bg-cyan-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-cyan-700 shrink-0">Copy</button>
          </div>
          <p className="text-xs text-gray-400 mb-4">Created {new Date(key.createdAt).toLocaleString()}{key.lastUsedAt ? ` · last used ${new Date(key.lastUsedAt).toLocaleString()}` : ""}</p>
          <div className="flex gap-3">
            <button onClick={testKey} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Test key</button>
            <button onClick={revoke} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100">Revoke key</button>
          </div>
          {testResult && <p className="text-sm mt-3 font-medium">{testResult}</p>}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-semibold mb-2">How to use it</h3>
        <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">{`# The public API needs NO key:
curl https://johnweb-qncu.onrender.com/api/public/papers?grade=7

# Your key works with authenticated dev endpoints:
curl https://johnweb-qncu.onrender.com/api/dev/me \\
  -H "Authorization: devkey_YOUR_KEY"`}</pre>
      </div>
    </div>
  );
}