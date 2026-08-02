import { useEffect, useState } from "react";

export default function FollowButton({ targetId }: { targetId: string }) {
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`/api/follow/status/${targetId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json()).then((d) => { setFollowing(d.following); setCount(d.count); });
  }, [targetId]);

  const toggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login to follow");
    if (following) {
      const res = await fetch(`/api/follow/${targetId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.following === false) { setFollowing(false); setCount((c) => Math.max(0, c - 1)); }
    } else {
      const res = await fetch(`/api/follow/${targetId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.following) { setFollowing(true); setCount((c) => c + 1); }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{count} follower{count !== 1 ? "s" : ""}</span>
      <button
        onClick={toggle}
        className={`text-xs px-3 py-1 rounded-full font-medium transition ${following ? "bg-gray-200 text-gray-600 hover:bg-gray-300" : "bg-blue-600 text-white hover:bg-blue-700"}`}
      >
        {following ? "Following" : "+ Follow"}
      </button>
    </div>
  );
}
