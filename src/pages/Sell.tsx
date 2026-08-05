import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";
import { Link } from "react-router-dom";

export default function Sell() {
  usePageTitle("Sell");
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [plan, setPlan] = useState("k50");
  const [payeeNumber, setPayeeNumber] = useState("0771460648");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string | null>(null);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem("user") || "null")); } catch {}
    load();
  }, []);

  const load = async () => {
    try {
      const t = localStorage.getItem("token");
      const r = await fetch("/api/admin/invoices", { headers: { Authorization: `Bearer ${t}` } });
      const d = await r.json();
      if (Array.isArray(d)) setInvoices(d);
    } catch {}
  };

  if (user && !["admin", "super_admin", "omni_super"].includes(user.role)) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">Admins only</h1>
        <p className="text-gray-500 text-sm mb-6">This page is for JohnWeb sellers. Log in with an admin account.</p>
        <Link to="/login" className="text-green-700 font-medium">← Go to login</Link>
      </div>
    );
  }
  if (!user) return null;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setMsg(""); setCreated(null);
    if (!title.trim() || !(Number(amount) > 0)) { setErr("Title and amount are required"); return; }
    setBusy(true);
    try {
      const t = localStorage.getItem("token");
      const r = await fetch("/api/admin/invoices", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ title, amount: Number(amount), description, plan, payeeNumber }),
      });
      const d = await r.json();
      if (!r.ok) { setErr(d.error || "Failed to create"); setBusy(false); return; }
      setCreated(d.link);
      setTitle(""); setAmount(""); setDescription("");
      setMsg(`Invoice ${d.invoice.code} created — share the link!`);
      load();
      setBusy(false);
    } catch { setErr("Could not reach the server."); setBusy(false); }
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this invoice? Its code becomes unused again.")) return;
    const t = localStorage.getItem("token");
    await fetch(`/api/admin/invoices/${id}/revoke`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this invoice permanently?")) return;
    const t = localStorage.getItem("token");
    await fetch(`/api/admin/invoices/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
    load();
  };

  const waText = (inv: any) => `Hi! I want to buy: ${inv.title} for K${inv.amount} on JohnWeb.\nI have sent the money — here's my link: ${window.location.origin}/invoice/${inv.code}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">💰 Sell Online</h1>
      <p className="text-gray-500 text-sm mb-8">Create a payment link, share it on WhatsApp, and access is granted automatically the moment the buyer confirms payment.</p>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}
      {err && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">{err}</div>}

      <form onSubmit={create} className="bg-white p-6 rounded-xl border shadow-sm space-y-4 mb-8">
        <h2 className="font-semibold">Create a payment link</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">What are you selling?</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. Teacher Full Access (K200)" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (ZMW)</label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="200" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">What do they get? (shown to buyer)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full p-2 border rounded-lg" placeholder="e.g. Full teacher access: all past papers, mark answers, manage classes" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Auto-grant access code</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full p-2 border rounded-lg">
              <option value="k200">Yes — K200 teacher code</option>
              <option value="k100">Yes — K100 code</option>
              <option value="k50">Yes — K50 code</option>
              <option value="k20">Yes — K20 code</option>
              <option value="none">No — I'll deliver manually</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">The buyer gets this code instantly after paying, and redeems it in the app.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pay into this MoMo number</label>
            <input value={payeeNumber} onChange={(e) => setPayeeNumber(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="0771460648" />
          </div>
        </div>
        <button type="submit" disabled={busy} className="bg-green-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-60">
          {busy ? "Creating…" : "Create Payment Link"}
        </button>
        {created && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Your link (share this):</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="bg-white border rounded px-2 py-1 text-sm flex-1 min-w-[200px] select-all break-all">{created}</code>
              <button type="button" onClick={() => { navigator.clipboard.writeText(created); setMsg("Link copied!"); }} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm">Copy</button>
              <a href={`https://wa.me/?text=${encodeURIComponent(waText({ title: title || "this offer", amount, code: created.split("/").pop() }))}`} target="_blank" rel="noreferrer" className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm">Share on WhatsApp</a>
            </div>
          </div>
        )}
      </form>

      <h2 className="font-semibold mb-3">Your payment links ({invoices.length})</h2>
      {invoices.length === 0 && <p className="text-gray-400 text-sm">No invoices yet — create your first one above.</p>}
      <div className="space-y-3">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white rounded-xl border shadow-sm p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{inv.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${inv.status === "paid" ? "bg-green-100 text-green-700" : inv.status === "revoked" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>
                  {inv.status === "paid" ? "PAID" : inv.status === "revoked" ? "REVOKED" : "OPEN"}
                </span>
              </div>
              <p className="text-sm text-gray-500">K{inv.amount} · code {inv.code} · {inv.createdAt?.slice(0, 10)}</p>
              {inv.payer && (
                <p className="text-xs text-green-700 mt-0.5">💰 Paid by {inv.payer.name} ({inv.payer.phone}) {inv.payer.reference ? `· ref ${inv.payer.reference}` : ""} on {inv.paidAt?.slice(0, 10)}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a href={`/invoice/${inv.code}`} target="_blank" rel="noreferrer" className="text-sm text-green-700 font-medium hover:underline">Open</a>
              <button type="button" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/invoice/${inv.code}`); setMsg(`Link for ${inv.code} copied!`); }} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm">Copy</button>
              {inv.status !== "revoked" && <button type="button" onClick={() => revoke(inv.id)} className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm">Revoke</button>}
              <button type="button" onClick={() => remove(inv.id)} className="text-gray-400 hover:text-red-600 text-sm">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}