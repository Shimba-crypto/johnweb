import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import FollowButton from "../components/FollowButton";
import StarRating from "../components/StarRating";

export default function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [myUser, setMyUser] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/users/${id}/public`).then((r) => r.json()).then(setProfile);
    const u = localStorage.getItem("user");
    if (u) try { setMyUser(JSON.parse(u)); } catch {}
  }, [id]);

  if (!profile) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  const roleLabels: Record<string, string> = { super_admin: "Super Admin", admin: "Admin", teacher: "Teacher", investor: "Investor", student: "Student", bot: "Bot", mod_bot: "MOD Bot", dev: "Developer" };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className={`px-2 py-0.5 rounded text-xs ${profile.role === "super_admin" ? "bg-purple-100 text-purple-700" : profile.role === "teacher" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{roleLabels[profile.role] || profile.role}</span>
              <span>{profile.avgRating > 0 ? `${profile.avgRating} ★ (${profile.ratingCount})` : "No ratings yet"}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Joined {new Date(profile.createdAt).toLocaleDateString()}</p>
            {profile.badges?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.badges.map((b: string, i: number) => <span key={i} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">{b}</span>)}
              </div>
            )}
          </div>
          {myUser && myUser.id !== profile.id && <FollowButton targetId={profile.id} />}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center"><div className="text-2xl font-bold text-green-600">{profile.totalAnswers}</div><div className="text-xs text-gray-500">Answers</div></div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center"><div className="text-2xl font-bold text-blue-600">{profile.percentage}%</div><div className="text-xs text-gray-500">Accuracy</div></div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center"><div className="text-2xl font-bold text-purple-600">Lvl {profile.level}</div><div className="text-xs text-gray-500">{profile.xp} XP</div></div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center"><div className="text-2xl font-bold text-orange-600">🔥{profile.streak}</div><div className="text-xs text-gray-500">Streak</div></div>
      </div>

      {profile.role === "student" || profile.role === "teacher" || profile.role === "super_admin" ? (
        <div className="text-center">
          {profile.role === "teacher" || profile.role === "super_admin" ? (
            <StarRating value={0} onChange={(s) => {
              const t = localStorage.getItem("token");
              if (!t) return alert("Login to rate");
              fetch("/api/ratings", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ targetId: profile.id, score: s, targetType: "teacher" }) }).then((r) => r.json()).then(() => { fetch(`/api/users/${id}/public`).then((r) => r.json()).then(setProfile); });
            }} size="lg" />
          ) : (
            <p className="text-gray-400 text-sm">Student profiles can be followed but not rated.</p>
          )}
        </div>
      ) : null}

      <div className="mt-6 text-center">
        <Link to="/leaderboard" className="text-green-600 hover:underline text-sm">View Leaderboard</Link>
      </div>
    </div>
  );
}
