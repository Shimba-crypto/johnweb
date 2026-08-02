import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Achievements() {
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) { try { const parsed = JSON.parse(u); setUser(parsed); fetch(`/api/achievements/${parsed.id}`).then((r) => r.json()).then(setData); } catch {} }
    else navigate("/login");
  }, [navigate]);

  if (!user || !data) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-gray-500">Level {data.level} · {data.xp} XP · 🔥{data.streak} day streak</p>
        </div>
        <Link to={`/user/${user.id}`} className="text-sm text-green-600 hover:underline">My public profile</Link>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2"><span>XP Progress to Level {data.level + 1}</span><span className="text-gray-500">{data.xp} XP</span></div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, (data.xp % 100) / 100 * 100)}%` }} /></div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Unlocked ({data.unlocked.length}/{data.unlocked.length + data.locked.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {data.unlocked.map((a: any) => (
          <div key={a.id} className="bg-white p-4 rounded-xl border shadow-sm text-center">
            <div className="text-3xl mb-2">{a.icon}</div>
            <div className="font-semibold text-green-700">{a.name}</div>
            <div className="text-xs text-gray-500 mt-1">{a.desc}</div>
          </div>
        ))}
        {data.unlocked.length === 0 && <p className="col-span-full text-gray-400 text-center py-4">No achievements yet. Start practicing!</p>}
      </div>

      <h2 className="text-xl font-semibold mb-4">Locked</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.locked.map((a: any) => (
          <div key={a.id} className="bg-gray-50 p-4 rounded-xl border shadow-sm text-center opacity-60 grayscale">
            <div className="text-3xl mb-2">{a.icon}</div>
            <div className="font-semibold">{a.name}</div>
            <div className="text-xs text-gray-500 mt-1">{a.desc}</div>
            <div className="text-xs text-gray-400 mt-2">🔒 Locked</div>
          </div>
        ))}
      </div>
    </div>
  );
}
