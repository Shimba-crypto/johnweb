import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Profile() {
  usePageTitle("My Profile");
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

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Image must be under 2MB");
    const t = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/avatar", { method: "POST", headers: { Authorization: `Bearer ${t}` }, body: fd });
    const data = await res.json();
    if (data.url) {
      const updated = { ...user, avatar: data.url };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    } else alert(data.error || "Upload failed");
  };
  const [subjects, setSubjects] = useState<any[]>([]);
  const [cert, setCert] = useState<any>(null);
  const [referral, setReferral] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (user) {
      fetch("/api/follow/followers", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setFollowers);
      fetch("/api/follow/following", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setFollowing);
      fetch(`/api/progress/${user.id}`).then((r) => r.json()).then(setProgress);
      fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
      fetch("/api/certificate/me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setCert);
      fetch("/api/referral/status", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setReferral);
    }
  }, [user]);

  const correct = answers.filter((a) => a.isCorrect).length;
  const total = answers.length;

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-xl border shadow-sm mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
                {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name?.[0]?.toUpperCase()}
              </div>
              <label className="absolute bottom-0 right-0 bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer text-xs hover:bg-green-700" title="Change photo">
                📷
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
          <Link to={`/user/${user.id}`} className="text-xs text-green-600 hover:underline">View public profile →</Link>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className={`px-2 py-0.5 rounded ${user.role === "super_admin" ? "bg-purple-100 text-purple-700" : user.role === "admin" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{user.role}</span>
          {user.subscription && user.subscription !== "free" ? (
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-medium">
              {({ k10: "K10", k20: "K20", k30: "K30", k50: "Student Plus", k100: "K100" } as any)[user.subscription] || user.subscription}
              {user.subscriptionExpiresAt && <span className="opacity-70 ml-1">· expires {new Date(user.subscriptionExpiresAt).toLocaleDateString()}</span>}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500">Free plan</span>
          )}
        </div>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-gray-500"><strong className="text-gray-800">{followers.length}</strong> followers</span>
          <span className="text-gray-500"><strong className="text-gray-800">{following.length}</strong> following</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 w-fit">
          ☁️ Progress auto-saves to the cloud — log in on any phone or computer and pick up where you left off.
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
        <div className="mb-8">
          {(() => {
            const entries = Object.entries(progress.bySubject || {});
            const mastered = entries.filter(([, v]: any) => v.total >= 3 && v.correct / v.total >= 0.8).length;
            return (
              <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">📈 Mastery</div>
                  <div className="text-sm opacity-90">{mastered} of {entries.length} subjects mastered (80%+ accuracy)</div>
                </div>
                <div className="text-3xl font-bold">{entries.length ? Math.round((mastered / entries.length) * 100) : 0}%</div>
              </div>
            );
          })()}
        </div>
      )}

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
        <a
          href={`/api/progress-card/${user.id}`}
          onClick={(e) => {
            e.preventDefault();
            window.open(`/api/progress-card/${user.id}`, "_blank");
          }}
          className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-100"
        >
          📊 My Progress Card
        </a>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-5 py-3 flex items-center justify-between">
          <h2 className="font-semibold">🎓 My Certificate</h2>
          {cert?.earned ? (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Verified ✓</span>
          ) : (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Not yet earned</span>
          )}
        </div>
        <div className="p-5">
          {cert?.earned && cert.qrUrl ? (
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <div className="shrink-0">
                <img src={cert.qrUrl} alt="Certificate verification QR" className="w-36 h-36 rounded-lg border p-2" width={144} height={144} />
                <p className="text-[10px] text-gray-400 text-center mt-1">Scan to verify</p>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="text-2xl font-bold text-gray-800">{user.name}</div>
                <div className="text-sm text-gray-500">Certificate of Achievement · {cert.pct}% accuracy · {cert.answers} answers</div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  <a href="/api/certificate" target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">👁 View Certificate</a>
                  <a href={cert.verifyUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg text-sm hover:bg-blue-100">🔍 Verify Online</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🎓</div>
              <p className="text-gray-500">Keep practising — earn answers and accuracy to unlock your certificate.</p>
              <p className="text-xs text-gray-400 mt-1">Requires a reasonable number of correct answers and good accuracy.</p>
            </div>
          )}
        </div>
      </div>

      {user.role === "student" && referral?.allowed && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-700 to-purple-600 text-white px-5 py-3 flex items-center justify-between">
            <h2 className="font-semibold">🎁 Invite Friends</h2>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{referral?.count || 0} joined</span>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 mb-3">Invite <strong>2 or more friends</strong> — each one who joins gets a <strong>free week of Student Plus (K50 plan)</strong>.</p>
            {referral?.link && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input readOnly value={referral.link} onFocus={(e) => e.target.select()} className="flex-1 p-2 border rounded-lg text-sm bg-gray-50 font-mono" />
                <button
                  onClick={async () => {
                    try { await navigator.clipboard.writeText(referral.link); } catch {}
                    setCopied(true); setTimeout(() => setCopied(false), 2000);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700"
                >
                  {copied ? "✓ Copied!" : "📋 Copy Link"}
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-3">Share this link on WhatsApp, school groups, or with family. New sign-ups get a free week of the K50 plan.</p>
          </div>
        </div>
      )}

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
