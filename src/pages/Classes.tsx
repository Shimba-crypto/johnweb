import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Classes() {
  usePageTitle("Classes");
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const token = localStorage.getItem("token");

  const load = () => fetch("/api/classes/mine", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setClasses);

  useEffect(() => {
    if (!token) return navigate("/login");
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) navigate("/login"); else setUser(d); });
    load();
    fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
  }, [navigate, token]);

  const createClass = async () => {
    setErr("");
    const res = await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) });
    const d = await res.json();
    if (d.error) setErr(d.error); else { setName(""); load(); }
  };

  const joinClass = async () => {
    setErr("");
    const res = await fetch("/api/classes/join", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code }) });
    const d = await res.json();
    if (d.error) setErr(d.error); else { setCode(""); load(); }
  };

  const assign = async (clsId: string) => {
    const papers = subjects.flatMap((s: any) => (s.papers || []).map((p: any) => ({ ...p, subjectName: s.name })));
    const chosen = papers[Math.floor(Math.random() * papers.length)];
    if (!chosen) return alert("No papers available");
    await fetch(`/api/classes/${clsId}/assign`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ paperId: chosen.id }) });
    load();
  };

  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">🏫 Classes</h1>
      <p className="text-gray-500 mb-8">{user.role === "teacher" || user.role === "admin" || user.role === "super_admin" ? "Create a class, share the code, assign papers." : "Join your teacher's class with the class code."}</p>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {(user.role === "teacher" || user.role === "admin" || user.role === "super_admin") ? (
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-2">Create a class</h3>
            <div className="flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grade 7A Mathematics" className="flex-1 p-2 border rounded-lg" />
              <button onClick={createClass} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Create</button>
            </div>
          </div>
        ) : null}
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-2">Join with a code</h3>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CLASS CODE" className="flex-1 p-2 border rounded-lg font-mono" />
            <button onClick={joinClass} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Join</button>
          </div>
        </div>
      </div>
      {err && <p className="text-red-600 text-sm mb-4">{err}</p>}
      {msg && <p className="text-green-600 text-sm mb-4">{msg}</p>}

      {classes.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center text-gray-500">No classes yet.</div>
      ) : (
        <div className="space-y-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{c.name}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {c.isTeacher ? <>Teacher · Code: <b className="font-mono">{c.joinCode}</b> · {c.students.length} students</> : <>Student · Teacher: {c.teacherName}</>}
                  </div>
                </div>
                {c.isTeacher && (
                  <button onClick={() => assign(c.id)} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700">Assign a paper</button>
                )}
              </div>

              {c.assignments?.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs font-medium text-gray-400">Assignments:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {c.assignments.map((a: any) => (
                      <Link key={a.id} to={`/paper/${a.paperId}`} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded">{a.paperTitle}{a.dueDate ? ` · due ${a.dueDate}` : ""}</Link>
                    ))}
                  </div>
                </div>
              )}

              {c.isTeacher && c.students.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-xs font-medium text-gray-400">Student progress:</span>
                  <div className="space-y-1 mt-2">
                    {c.students.map((s: any) => (
                      <div key={s.id} className="flex items-center gap-2 text-sm">
                        <span className="w-32 truncate">{s.name}</span>
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${s.pct}%` }} /></div>
                        <span className="text-xs text-gray-500 w-20 text-right">{s.answers} ans · {s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
