import { useEffect, useState } from "react";

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
      <span>📡</span> You're offline — answers need internet, but you can still view papers.
    </div>
  );
}
