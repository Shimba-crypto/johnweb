import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

export default function NotificationBell() {
  const [data, setData] = useState<{ notifications: any[]; unread: number }>({ notifications: [], unread: 0 });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = localStorage.getItem("user");

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      const t = localStorage.getItem("token");
      if (!t) return;
      fetch("/api/notifications", { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).then(setData);
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markRead = async (id: string) => {
    const t = localStorage.getItem("token");
    await fetch(`/api/notifications/${id}/read`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    setData((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1), notifications: prev.notifications.map((n) => n.id === id ? { ...n, read: true } : n) }));
  };

  const markAllRead = async () => {
    const t = localStorage.getItem("token");
    await fetch("/api/notifications/read-all", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    setData((prev) => ({ ...prev, unread: 0, notifications: prev.notifications.map((n) => ({ ...n, read: true })) }));
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative text-gray-600 hover:text-gray-900">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {data.unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{data.unread > 9 ? "9+" : data.unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-white">
            <span className="font-semibold text-sm">Notifications</span>
            {data.unread > 0 && <button onClick={markAllRead} className="text-xs text-green-600 hover:underline">Mark all read</button>}
          </div>
          {data.notifications.length === 0 && <p className="p-4 text-center text-gray-400 text-sm">No notifications</p>}
          {data.notifications.map((n) => (
            <Link key={n.id} to={n.link || "#"} onClick={() => { if (!n.read) markRead(n.id); setOpen(false); }} className={`block p-3 border-b last:border-b-0 hover:bg-gray-50 ${!n.read ? "bg-green-50" : ""}`}>
              <div className="text-sm font-medium">{n.title}</div>
              <div className="text-xs text-gray-500 truncate">{n.message}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleDateString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
