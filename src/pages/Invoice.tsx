import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Invoice() {
  usePageTitle("Pay");
  const { code } = useParams<{ code: string }>();
  const [inv, setInv] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [grant, setGrant] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${code}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setNotFound(true); else setInv(d); })
      .catch(() => setNotFound(true));
  }, [code]);

  if (notFound) return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-4">❌</div>
      <h1 className="text-2xl font-bold mb-2">Invoice not found</h1>
      <p className="text-gray-500 text-sm mb-6">This payment link is invalid or has been removed.</p>
      <Link to="/" className="text-green-700 font-medium">← Back to JohnWeb</Link>
    </div>
  );

  if (!inv) return null;

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch(`/api/invoices/${code}/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, reference }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Something went wrong"); setBusy(false); return; }
      setGrant(d.grant || "");
    } catch { setError("Could not reach the server. Check your connection."); setBusy(false); }
  };

  if (grant !== null) return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-3">✅</div>
      <h1 className="text-2xl font-bold mb-1">Payment confirmed!</h1>
      <p className="text-gray-500 mb-6">Thank you, {name}. Your access has been granted instantly.</p>
      {grant ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
          <p className="text-sm text-gray-600 mb-2">Your access code (keep it safe):</p>
          <div className="text-2xl font-mono font-bold tracking-widest text-green-700 select-all">{grant}</div>
          <p className="text-xs text-gray-400 mt-3">Log in at johnweb-qncu.onrender.com → Redeem to activate (or open the Install page for the app).</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">We'll contact you with your purchase shortly.</p>
      )}
      <Link to="/" className="mt-4 inline-block bg-green-600 text-white px-5 py-2 rounded-lg font-medium">Go to JohnWeb</Link>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="bg-green-600 px-6 py-5 text-white">
          <p className="text-xs uppercase tracking-wide opacity-80">JohnWeb Payment Link</p>
          <h1 className="text-xl font-bold mt-1">{inv.title}</h1>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-end justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-lg font-bold text-gray-800">Special offer</p>
            </div>
            <div className="text-3xl font-extrabold text-green-700">K{inv.amount}</div>
          </div>
          {inv.description && <p className="text-gray-600 text-sm">{inv.description}</p>}
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <p className="font-semibold mb-1">How to pay</p>
            <p className="text-gray-600">Send <b>K{inv.amount}</b> via Airtel or MTN Mobile Money to:</p>
            <p className="text-xl font-bold text-gray-800 mt-1 select-all">{inv.payeeNumber}</p>
            <p className="text-gray-500 text-xs">({inv.payeeName}) — then confirm below.</p>
          </div>
          <form onSubmit={confirm} className="space-y-3">
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div>
              <label className="block text-sm font-medium mb-1">Your name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" required placeholder="e.g. Mwamba Kaunda" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your phone number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2 border rounded-lg" required placeholder="e.g. 0971234567" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment reference (optional)</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="The moment you get from your MoMo app" />
            </div>
            <button type="submit" disabled={busy} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-60">
              {busy ? "Confirming…" : "I've paid — give me access"}
            </button>
            <p className="text-[11px] text-gray-400 text-center">By confirming you agree you have sent the full amount. Fake confirmations are tracked and your access can be revoked.</p>
          </form>
        </div>
      </div>
    </div>
  );
}