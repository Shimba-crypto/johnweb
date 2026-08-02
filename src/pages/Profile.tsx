import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.error) navigate("/login"); else setUser(data); })
      .catch(() => navigate("/login"));
    fetch("/api/answers/mine", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setAnswers);
  }, [navigate]);

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (user) {
      fetch("/api/follow/followers", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setFollowers);
      fetch("/api/follow/following", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setFollowing);
      fetch(`/api/progress/${user.id}`).then((r) => r.json()).then(setProgress);
      fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
    }
  }, [user]);

  const correct = answers.filter((a) => a.isCorrect).length;
  const total = answers.length;

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <Link to={`/user/${user.id}`} className="text-xs text-green-600 hover:underline">View public profile →</Link>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className={`px-2 py-0.5 rounded ${user.role === "super_admin" ? "bg-purple-100 text-purple-700" : user.role === "admin" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{user.role}</span>
          <span className="text-gray-400">{(user.subscription || "free")}</span>
        </div>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-gray-500"><strong className="text-gray-800">{followers.length}</strong> followers</span>
          <span className="text-gray-500"><strong className="text-gray-800">{following.length}</strong> following</span>
        </div>
        {following.length > 0 && (
          <div className="mt-3">
            <span className="text-xs text-gray-400 font-medium">Following: </span>
            {following.map((f) => (
              <span key={f.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded ml-1">{f.name}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{total}</div>
          <div className="text-sm text-gray-500">Total Answers</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-2xl font-bold text-green-600">{correct}</div>
          <div className="text-sm text-gray-500">Correct</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-2xl font-bold text-gray-600">{total ? Math.round((correct / total) * 100) : 0}%</div>
          <div className="text-sm text-gray-500">Score</div>
        </div>
      </div>

      {progress && (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-3">Accuracy by Subject</h3>
            {Object.keys(progress.bySubject).length === 0 && <p className="text-gray-400 text-sm">No data yet.</p>}
            <div className="space-y-2">
              {Object.entries(progress.bySubject).map(([sid, v]: any) => {
                const sub = subjects.find((s: any) => s.id === sid);
                const pct = v.total ? Math.round((v.correct / v.total) * 100) : 0;
                return (
                  <div key={sid}>
                    <div className="flex justify-between text-xs mb-1"><span>{sub?.name || "?"}</span><span className="text-gray-500">{pct}% ({v.correct}/{v.total})</span></div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-3">Progress Over Time</h3>
            {progress.byDay.length === 0 && <p className="text-gray-400 text-sm">No data yet.</p>}
            <div className="flex items-end gap-1 h-24">
              {progress.byDay.slice(-14).map((d: any, i: number) => {
                const max = Math.max(...progress.byDay.map((x: any) => x.total), 1);
                return <div key={i} className="flex-1 flex flex-col items-center"><div className="w-full bg-green-200 rounded-t" style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total > 0 ? 4 : 0 }} title={`${d.date}: ${d.correct}/${d.total}`} /></div>;
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Answers per day (last 14 days)</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <Link to="/achievements" className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 border border-yellow-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-100">
          🏆 Achievements
        </Link>
        <a
          href="/api/certificate"
          onClick={(e) => {
            e.preventDefault();
            const t = localStorage.getItem("token");
            fetch("/api/certificate", { headers: { Authorization: `Bearer ${t}` } })
              .then((r) => r.blob())
              .then((blob) => { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "johnweb-certificate.html"; a.click(); URL.revokeObjectURL(url); });
          }}
          className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-100"
        >
          🎓 Download Certificate
        </a>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Answer History</h2>
        {total > 0 && (
          <a
            href="/api/export/csv"
            onClick={(e) => {
              e.preventDefault();
              const t = localStorage.getItem("token");
              fetch("/api/export/csv", { headers: { Authorization: `Bearer ${t}` } })
                .then((r) => r.blob())
                .then((blob) => {
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "johnweb-results.csv"; a.click();
                  URL.revokeObjectURL(url);
                });
            }}
            className="text-sm text-green-600 hover:underline font-medium"
          >
            Export CSV ↓
          </a>
        )}
      </div>
      {answers.length === 0 && (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center text-gray-500">
          <p className="mb-2">No answers submitted yet.</p>
          <Link to="/browse" className="text-green-600 hover:underline">Browse past papers</Link>
        </div>
      )}
      <div className="space-y-3">
        {answers.map((a) => (
          <div key={a.id} className={`bg-white p-4 rounded-xl border shadow-sm ${a.isCorrect ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-400"}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs text-gray-500">{a.paper?.title || "Unknown paper"} | Q{a.question?.questionNumber || "?"}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${a.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {a.isCorrect ? "Correct" : "Incorrect"}
              </span>
            </div>
            <p className="text-sm text-gray-800 mb-1 line-clamp-2">{a.question?.text || "Unknown question"}</p>
            <p className="text-xs text-gray-500">Your answer: {a.content}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
