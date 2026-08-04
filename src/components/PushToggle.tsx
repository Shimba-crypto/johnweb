import { useEffect, useState } from "react";

declare global {
  interface Window {
    PushManager?: any;
  }
}

// Registers the service worker and browser push subscription for the current user.
export default function PushToggle({ token }: { token: string }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    if (!ok) { setMsg("Your browser does not support push notifications."); return; }
    // Check current state
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        navigator.serviceWorker.ready.then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          setEnabled(!!sub);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const enable = async () => {
    setBusy(true); setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setMsg("Permission denied. Allow notifications in your browser settings."); return; }
      // Register service worker (idempotent)
      const reg = await navigator.serviceWorker.register("/sw.js");
      // Fetch VAPID key
      const keyRes = await fetch("/api/push/key");
      const { publicKey } = await keyRes.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const d = await res.json();
      if (d.ok) { setEnabled(true); setMsg("✅ Notifications enabled. We'll alert you about new papers and results."); }
      else setMsg(d.error || "Could not enable notifications.");
    } catch (e: any) {
      setMsg(e?.message || "Could not enable push notifications.");
    } finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
      setMsg("Notifications disabled.");
    } catch { setMsg("Could not disable notifications."); }
    finally { setBusy(false); }
  };

  if (!supported) return <p className="text-sm text-gray-500">Push notifications are not supported in this browser.</p>;

  return (
    <div>
      {enabled ? (
        <button onClick={disable} disabled={busy} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
          {busy ? "Working…" : "🔕 Disable Notifications"}
        </button>
      ) : (
        <button onClick={enable} disabled={busy} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
          {busy ? "Working…" : "🔔 Enable Notifications"}
        </button>
      )}
      {msg && <p className="text-sm text-gray-500 mt-2">{msg}</p>}
    </div>
  );
}
