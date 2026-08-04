import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Teacher() {
  const [user, setUser] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const navigate = useNavigate();

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    const t = token();
    if (!t) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error || !["teacher", "admin", "super_admin"].includes(d.role)) navigate("/"); else setUser(d); })
      .catch(() => navigate("/"));
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetch("/api/teacher/pending", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()).then(setPending);
      fetch("/api/teacher/students", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()).then(setStudents);
    }
  }, [user]);

  const grade = async (answerId: string, isCorrect: boolean) => {
    const fb = isCorrect ? "Correct!" : prompt("Feedback for student:");
    if (!fb) return;
    await fetch("/api/teacher/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ answerId, isCorrect, feedback: fb }),
    });
    setPending((prev) => prev.filter((a) => a.id !== answerId));
  };

  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {user.planLocked && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-yellow-800">🔒 Preview mode</div>
            <div className="text-sm text-yellow-700">Your teacher plan activates once the admin confirms your K200 payment. You can preview, but grading is limited.</div>
          </div>
          <a href="/profile" className="text-sm text-yellow-800 underline shrink-0">Payment details</a>
        </div>
      )}
      <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
      <p className="text-gray-500 mb-8">Grade student answers | {pending.length} pending{user.planLocked ? " · Preview mode" : ""}</p>

      {pending.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center text-gray-500">
          No pending answers to review.
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <div key={a.id} className="bg-white p-4 rounded-xl border shadow-sm border-l-4 border-l-yellow-400">
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm text-gray-500">{a.student?.name || "?"} · {a.paper?.title || "?"} · Q{a.question?.questionNumber || "?"}</div>
              </div>
              <p className="text-sm mb-1"><span className="font-medium">Question:</span> {a.question?.text || "?"}</p>
              <p className="text-sm mb-1"><span className="font-medium">Answer:</span> {a.content}</p>
              <p className="text-sm mb-3"><span className="font-medium">Model:</span> {a.question?.modelAnswer || "?"}</p>
              <div className="flex gap-2">
                <button onClick={() => grade(a.id, true)} disabled={user.planLocked} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed">Correct</button>
                <button onClick={() => grade(a.id, false)} disabled={user.planLocked} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">Incorrect</button>
              </div>
              {user.planLocked && <p className="text-xs text-gray-400 mt-1">🔒 Locked until your plan is confirmed.</p>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Students ({students.length})</h2>
          <Link to="/join/primarysteps" className="text-sm text-green-600 hover:underline">Share registration link →</Link>
        </div>
        {students.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border shadow-sm text-center text-gray-500">
            No students yet. Share the registration link so they can join.
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-500">
              <div className="col-span-2">Student</div>
              <div>Answers</div>
              <div className="text-right">Accuracy</div>
            </div>
            {students.map((s) => (
              <div key={s.id} className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0 items-center hover:bg-gray-50">
                <div className="col-span-2">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.school || "—"} · joined {new Date(s.joined).toLocaleDateString()}</div>
                </div>
                <div className="text-gray-600">{s.answers}</div>
                <div className="text-right font-semibold text-green-600">{s.answers ? Math.round((s.correct / s.answers) * 100) : 0}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
