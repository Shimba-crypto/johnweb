import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

type Tab = "overview" | "subjects" | "papers" | "questions" | "answers" | "news" | "contacts" | "logs" | "payments" | "users";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allAnswers, setAllAnswers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [stats, setStats] = useState<any>(null);
  const navigate = useNavigate();

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    const t = token();
    if (!t) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) navigate("/login"); else setUser(d); })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const fetchSubjects = () =>
    fetch("/api/subjects").then((r) => r.json()).then((d) => { setSubjects(d); setPapers(d.flatMap((s: any) => s.papers || [])); });
  const fetchQuestions = (paperId: string) => {
    if (!paperId) { setQuestions([]); return; }
    fetch(`/api/questions?paperId=${paperId}`).then((r) => r.json()).then(setQuestions);
  };
  const fetchUsers = () =>
    fetch("/api/users", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()).then(setUsers);
  const fetchAnswers = () =>
    fetch("/api/admin/answers", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()).then(setAllAnswers);

  useEffect(() => { fetchSubjects(); }, []);
  useEffect(() => { if (tab === "questions") fetchQuestions(selectedPaperId); }, [tab, selectedPaperId]);
  useEffect(() => { if (tab === "users") fetchUsers(); }, [tab]);
  useEffect(() => { if (tab === "answers") fetchAnswers(); }, [tab]);
  useEffect(() => {
    if (tab === "overview") fetch("/api/admin/stats", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()).then(setStats);
  }, [tab]);

  const api = async (method: string, url: string, body?: any) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const save = async (entity: string, data: any) => {
    if (editing) await api("PUT", `/api/admin/${entity}/${editing.id}`, data);
    else await api("POST", `/api/admin/${entity}`, data);
    setEditing(null); setShowForm(false);
    if (entity === "subjects") fetchSubjects();
    if (entity === "papers") fetchSubjects();
    if (entity === "questions") fetchQuestions(selectedPaperId);
  };

  const remove = async (entity: string, id: string) => {
    if (!confirm("Delete this item?")) return;
    await api("DELETE", `/api/admin/${entity}/${id}`);
    if (entity === "subjects") fetchSubjects();
    if (entity === "papers") fetchSubjects();
    if (entity === "questions") fetchQuestions(selectedPaperId);
  };

  const promote = async (userId: string, role: string) => {
    await api("PUT", `/api/admin/users/${userId}/role`, { role });
    fetchUsers();
  };

  const createBot = async () => {
    const name = prompt("Bot name:");
    if (!name) return;
    const subjects = prompt("Subjects (comma-separated, e.g. Mathematics, Science):") || "";
    const description = prompt("Description (shown on bot card):") || "";
    const systemPrompt = prompt("System prompt (personality for the AI — see example in chat):") || "";
    const result = await api("POST", "/api/admin/bots", { name, subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean), description, systemPrompt });
    if (result.apiKey) alert(`Bot created!\nAPI Key: ${result.apiKey}\n\nSave this key - it won't be shown again.`);
    else alert(result.error || "Error creating bot");
  };

  const generateCodes = async () => {
    const plan = prompt("Plan for the codes (k10, k20, k30, k50, k100):", "k20");
    if (!plan) return;
    const count = parseInt(prompt("How many codes?", "5") || "5");
    const result = await api("POST", "/api/admin/codes", { plan, count });
    if (result.codes) alert(`✅ ${result.codes.length} codes created:\n\n${result.codes.join("\n")}\n\nShare these with students to redeem.`);
    else alert(result.error || "Error creating codes");
  };

  const downloadBackup = async () => {
    const t = localStorage.getItem("token");
    const res = await fetch("/api/admin/backup", { headers: { Authorization: `Bearer ${t}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `johnweb-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createModBot = async () => {
    const name = prompt("MOD Bot name:");
    if (!name) return;
    const result = await api("POST", "/api/admin/mod-bots", { name });
    if (result.apiKey) alert(`MOD Bot created!\nAPI Key: ${result.apiKey}\n\nSave this key - it won't be shown again.`);
    else alert(result.error || "Error creating MOD bot");
  };

  if (!user) return <div className="max-w-6xl mx-auto px-4 py-8">Loading...</div>;
  if (user.role !== "super_admin") return <div className="max-w-6xl mx-auto px-4 py-8 text-center text-red-600">Super Admin access required</div>;

  const secretUnlocked = Boolean(localStorage.getItem("adminSecret"));

  const totalPapers = papers.length;
  const totalQuestions = stats?.questions || 0;
  const pendingAnswers = allAnswers.filter((a) => a.reviewStatus === "pending").length;
  const totalUsers = stats?.users || 0;

  const tabs: { key: Tab; label: string; badge?: string }[] = [
    { key: "overview", label: "Dashboard" },
    { key: "subjects", label: "Subjects" },
    { key: "papers", label: "Papers" },
    { key: "questions", label: "Questions" },
    { key: "answers", label: "Answers", badge: pendingAnswers ? String(pendingAnswers) : undefined },
    { key: "news", label: "News" },
    { key: "contacts", label: "Contacts" },
    { key: "logs", label: "Logs" },
    { key: "payments", label: "Payments" },
    { key: "users", label: "Users" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {!secretUnlocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
          <p className="text-sm text-yellow-800">🔒 <strong>Admin panel locked.</strong> Enter your admin secret in <Link to="/settings" className="underline font-medium">Settings → Admin Panel Access</Link> to unlock it in this browser.</p>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">Welcome, {user.name} · {new Date().toLocaleDateString("en-ZM", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">Back to site →</Link>
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowForm(false); setEditing(null); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${tab === t.key ? "bg-white border border-b-white -mb-px text-green-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
            {t.badge && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Subjects</div>
                  <div className="text-3xl font-bold text-green-600">{stats?.subjects || 0}</div>
                </div>
                <div className="text-3xl opacity-20">📚</div>
              </div>
              <div className="mt-2 text-xs text-gray-400">ECZ subjects</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Papers</div>
                  <div className="text-3xl font-bold text-blue-600">{stats?.papers || 0}</div>
                </div>
                <div className="text-3xl opacity-20">📄</div>
              </div>
              <div className="mt-2 text-xs text-gray-400">{stats?.papers > 0 ? `Grades 9 · 10 · 12` : "Past exam papers"}</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Questions</div>
                  <div className="text-3xl font-bold text-orange-600">{stats?.questions || 0}</div>
                </div>
                <div className="text-3xl opacity-20">❓</div>
              </div>
              <div className="mt-2 text-xs text-gray-400">Across all papers</div>
            </div>
            <div className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Users</div>
                  <div className="text-3xl font-bold text-purple-600">{stats?.users || 0}</div>
                </div>
                <div className="text-3xl opacity-20">👤</div>
              </div>
              <div className="mt-2 text-xs text-gray-400">{stats?.pending || 0} pending reviews</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-semibold mb-4">Papers by Grade</h3>
              {stats?.byGrade ? (
                <div className="space-y-3">
                  {["9", "10", "12"].map((g) => {
                    const count = stats.byGrade[g] || 0;
                    const max = Math.max(stats.byGrade["9"] || 0, stats.byGrade["10"] || 0, stats.byGrade["12"] || 0);
                    return (
                      <div key={g}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Grade {g}</span>
                          <span className="text-gray-500">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-gray-400 text-sm">Loading...</p>}
            </div>
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="font-semibold mb-4">Activity Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Answers submitted</span>
                  <span className="font-semibold">{stats?.answers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Auto-approved</span>
                  <span className="font-semibold text-green-600">{(stats?.answers || 0) - (stats?.pending || 0) - (stats?.correct || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending review</span>
                  <span className="font-semibold text-yellow-600">{stats?.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Correct answers</span>
                  <span className="font-semibold text-green-600">{stats?.correct || 0}</span>
                </div>
              </div>
              {stats?.dailyActivity && stats.dailyActivity.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Last 14 days activity</h4>
                  <div className="flex items-end gap-1 h-16">
                    {stats.dailyActivity.map((d: any, i: number) => {
                      const maxCount = Math.max(...stats.dailyActivity.map((x: any) => x.count), 1);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-green-200 rounded-t" style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? 4 : 0 }} title={`${d.date}: ${d.count}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-600 to-green-500 text-white rounded-xl p-5">
              <h4 className="font-semibold mb-1">Quick Actions</h4>
              <div className="space-y-2 mt-3">
                <button onClick={() => setTab("subjects")} className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">Manage Subjects</button>
                <button onClick={() => setTab("answers")} className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">
                  Review Answers {stats?.pending > 0 && `(${stats.pending})`}
                </button>
                <button onClick={() => setTab("papers")} className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">Add Paper</button>
                <button onClick={createBot} className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">Create Bot</button>
                <button onClick={createModBot} className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">Create MOD Bot</button>
                <a href="/admin/post-news" className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">Post News</a>
                <button onClick={downloadBackup} className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">💾 Download Backup</button>
                <button onClick={generateCodes} className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">🎫 Generate Access Codes</button>
                <a href="/admin/bulk-import" className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">📥 Bulk Import Questions</a>
                <a href="/settings" className="block w-full text-left text-sm bg-white/20 rounded-lg px-3 py-2 hover:bg-white/30">Settings</a>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-xl p-5">
              <h4 className="font-semibold mb-1">Platform Info</h4>
              <div className="text-sm mt-3 space-y-1 opacity-90">
                <p>JohnWeb v1.0</p>
                <p>Zambian ECZ Platform</p>
                <p>Grades 9 · 10 · 12</p>
                <p>{(stats?.subjects || 0)} Subjects</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-600 to-orange-500 text-white rounded-xl p-5">
              <h4 className="font-semibold mb-1">Recent Registrations</h4>
              <div className="text-sm mt-3 space-y-2">
                {users.length === 0 && <p className="opacity-80">Loading...</p>}
                {users.slice(-3).reverse().map((u) => (
                  <div key={u.id} className="bg-white/20 rounded-lg px-3 py-2">
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs opacity-80">{new Date(u.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "subjects" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{subjects.length} Subjects</h2>
            <button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
              {showForm ? "Cancel" : "+ Add Subject"}
            </button>
          </div>
          {showForm && <SubjectForm initial={editing} onSave={(d) => save("subjects", d)} onCancel={() => { setShowForm(false); setEditing(null); }} />}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
                <div>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-gray-400 ml-2">({s.code})</span>
                  <span className="text-gray-400 ml-2 text-sm">{(s.papers || []).length} papers</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(s); setShowForm(true); }} className="text-blue-600 text-sm hover:underline">Edit</button>
                  <button onClick={() => remove("subjects", s.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "papers" && (
        <div>
          <div className="mb-4">
            <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {selectedSubjectId && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{papers.filter((p) => p.subjectId === selectedSubjectId).length} Papers</h2>
                <button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                  {showForm ? "Cancel" : "+ Add Paper"}
                </button>
              </div>
              {showForm && <PaperForm initial={editing} subjects={subjects} subjectId={selectedSubjectId} onSave={(d) => save("papers", d)} onCancel={() => { setShowForm(false); setEditing(null); }} />}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {papers.filter((p) => p.subjectId === selectedSubjectId).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50">
                    <div>
                      <span className="font-medium">{p.title}</span>
                      <span className="text-gray-400 ml-2">Grade {p.grade} | {p.year} | {p.examType}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditing(p); setShowForm(true); }} className="text-blue-600 text-sm hover:underline">Edit</button>
                      <button onClick={() => remove("papers", p.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "questions" && (
        <div>
          <div className="mb-4 flex gap-2">
            <select value={selectedSubjectId} onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedPaperId(""); }} className="px-4 py-2 border rounded-lg">
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedPaperId} onChange={(e) => setSelectedPaperId(e.target.value)} className="px-4 py-2 border rounded-lg">
              <option value="">Select paper</option>
              {papers.filter((p) => p.subjectId === selectedSubjectId).map((p) => (
                <option key={p.id} value={p.id}>{p.title} ({p.year})</option>
              ))}
            </select>
          </div>
          {selectedPaperId && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{questions.length} Questions</h2>
                <button onClick={() => { setEditing(null); setShowForm(!showForm); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
                  {showForm ? "Cancel" : "+ Add Question"}
                </button>
              </div>
              {showForm && <QuestionForm initial={editing} onSave={(d) => save("questions", d)} onCancel={() => { setShowForm(false); setEditing(null); }} />}
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {questions.map((q) => (
                  <div key={q.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium">Q{q.questionNumber}.</span> {q.text}
                        <span className="text-gray-400 ml-2">[{q.marks} marks]</span>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => { setEditing(q); setShowForm(true); }} className="text-blue-600 text-sm hover:underline">Edit</button>
                        <button onClick={() => remove("questions", q.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                      </div>
                    </div>
                    <details className="mt-1">
                      <summary className="text-xs text-gray-400 cursor-pointer">Model answer</summary>
                      <p className="text-sm text-gray-600 mt-1">{q.modelAnswer}</p>
                    </details>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === "answers" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{allAnswers.length} Answers</h2>
            <button onClick={fetchAnswers} className="text-gray-500 text-sm hover:text-gray-700">Refresh</button>
          </div>
          {pendingAnswers > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex items-center justify-between">
              <p className="text-yellow-800 font-medium">{pendingAnswers} answer{pendingAnswers !== 1 ? "s" : ""} pending review</p>
            </div>
          )}
          <div className="space-y-3">
            {allAnswers.length === 0 && <p className="text-gray-500 text-center py-8">No answers submitted yet.</p>}
            {allAnswers.map((a) => (
              <div key={a.id} className={`bg-white p-4 rounded-xl border shadow-sm ${a.reviewStatus === "pending" ? "border-yellow-300" : ""}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{a.user?.name || "Unknown"}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">{a.paper?.title || "?"} · Q{a.question?.questionNumber || "?"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      a.reviewStatus === "auto-approved" ? "bg-green-100 text-green-700" :
                      a.reviewStatus === "reviewed" ? (a.isCorrect ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700") :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{a.reviewStatus}</span>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-700 mb-1"><span className="font-medium text-gray-500">Answer:</span> {a.content}</p>
                <p className="text-sm text-gray-500 mb-2"><span className="font-medium text-gray-400">Model:</span> {a.question?.modelAnswer || "?"}</p>
                {a.reviewStatus === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={async () => { await api("POST", `/api/admin/answers/${a.id}/review`, { isCorrect: true, feedback: "Approved" }); fetchAnswers(); }} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Approve</button>
                    <button onClick={async () => { const fb = prompt("Reason for rejection:"); await api("POST", `/api/admin/answers/${a.id}/review`, { isCorrect: false, feedback: fb || "" }); fetchAnswers(); }} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Reject</button>
                  </div>
                )}
                {a.reviewStatus !== "pending" && a.feedback && <p className="text-xs text-gray-400 mt-1">Feedback: {a.feedback}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "news" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">News & Updates</h2>
            <a href="/admin/post-news" className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">+ Post News</a>
          </div>
          <NewsList />
        </div>
      )}

      {tab === "contacts" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Contact Messages</h2>
          <ContactList />
        </div>
      )}

      {tab === "logs" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Admin Activity Log</h2>
          <AdminLogs />
        </div>
      )}

      {tab === "payments" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Payment Requests</h2>
          <PaymentsList />
        </div>
      )}

      {tab === "users" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">{users.length} Users</h2>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-500">
              <div className="col-span-2">Name</div>
              <div className="col-span-2">Email</div>
              <div>Role</div>
              <div>Actions</div>
            </div>
            {users.map((u) => {
              const roleColors: Record<string, string> = {
                super_admin: "bg-purple-100 text-purple-700",
                admin: "bg-green-100 text-green-700",
                teacher: "bg-blue-100 text-blue-700",
                dev: "bg-gray-100 text-gray-700",
                investor: "bg-yellow-100 text-yellow-700",
                student: "bg-gray-100 text-gray-500",
                bot: "bg-cyan-100 text-cyan-700",
                mod_bot: "bg-red-100 text-red-700",
              };
              const roleLabels: Record<string, string> = {
                super_admin: "Super Admin",
                admin: "Admin",
                teacher: "Teacher",
                dev: "Developer",
                investor: "Investor",
                student: "Student",
                bot: "Bot",
                mod_bot: "MOD Bot",
              };
              return (
                <div key={u.id} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0 items-center hover:bg-gray-50">
                  <div className="col-span-2 font-medium">{u.name}</div>
                  <div className="col-span-2 text-gray-500 text-sm truncate">{u.email}</div>
                  <div>
                    <span className={`text-xs px-2 py-1 rounded ${roleColors[u.role] || "bg-gray-100 text-gray-600"}`}>{roleLabels[u.role] || u.role}</span>
                  </div>
                  <div className="flex gap-1">
                    {u.id !== "admin-trjohnx" && ["admin", "super_admin"].includes(user.role) && (
                      <select
                        value={u.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          const allowed = user.role === "super_admin"
                            ? ["student", "investor", "teacher", "dev", "admin", "bot", "mod_bot"]
                            : ["student", "investor", "teacher"];
                          if (!allowed.includes(newRole)) return alert("Cannot assign this role");
                          await api("PUT", `/api/admin/users/${u.id}/role`, { role: newRole });
                          fetchUsers();
                        }}
                        className="text-xs border rounded px-1 py-0.5"
                      >
                        <option value="student">Student</option>
                        <option value="investor">Investor</option>
                        <option value="teacher">Teacher</option>
                        {user.role === "super_admin" && <option value="dev">Developer</option>}
                        {user.role === "super_admin" && <option value="admin">Admin</option>}
                        {user.role === "super_admin" && <option value="bot">Bot</option>}
                        {user.role === "super_admin" && <option value="mod_bot">MOD Bot</option>}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NewsList() {
  const [news, setNews] = useState<any[]>([]);
  const token = () => localStorage.getItem("token");
  useEffect(() => { fetch("/api/news").then((r) => r.json()).then(setNews); }, []);
  const remove = async (id: string) => {
    if (!confirm("Delete this news item?")) return;
    await fetch(`/api/admin/news/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    setNews((prev) => prev.filter((n) => n.id !== id));
  };
  if (news.length === 0) return <p className="text-gray-500 text-center py-8">No news posted yet.</p>;
  return (
    <div className="space-y-3">
      {news.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded capitalize bg-gray-100 text-gray-600">{item.category}</span>
                <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{item.content}</p>
              <p className="text-xs text-gray-400 mt-2">By {item.author}</p>
            </div>
            <button onClick={() => remove(item.id)} className="text-red-500 text-sm hover:underline ml-4 shrink-0">Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactList() {
  const [contacts, setContacts] = useState<any[]>([]);
  const token = () => localStorage.getItem("token");
  useEffect(() => { fetch("/api/admin/contacts", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()).then(setContacts); }, []);
  if (contacts.length === 0) return <p className="text-gray-500 text-center py-8">No messages yet.</p>;
  return (
    <div className="space-y-3">
      {contacts.map((c) => (
        <div key={c.id} className="bg-white p-4 rounded-xl border shadow-sm">
          <div className="flex items-start justify-between mb-1">
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="text-gray-400 ml-2 text-sm">{c.email}</span>
            </div>
            <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
          </div>
          <p className="text-xs text-gray-500">{c.subject}</p>
          <p className="text-sm mt-1">{c.message}</p>
        </div>
      ))}
    </div>
  );
}

function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const token = () => localStorage.getItem("token");
  useEffect(() => { fetch("/api/admin/logs", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()).then(setLogs); }, []);
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden max-h-96 overflow-y-auto">
      {logs.length === 0 && <p className="p-4 text-gray-500 text-center">No logs yet.</p>}
      {logs.map((l) => (
        <div key={l.id} className="flex items-start gap-3 p-3 border-b last:border-b-0 text-sm hover:bg-gray-50">
          <span className="text-xs text-gray-400 shrink-0 w-16">{new Date(l.createdAt).toLocaleDateString()}</span>
          <span className="text-xs font-medium text-gray-600 shrink-0">{l.userName}</span>
          <span className="text-xs text-gray-500">{l.action}</span>
          <span className="text-xs text-gray-400">{l.details}</span>
        </div>
      ))}
    </div>
  );
}

function PaymentsList() {
  const [payments, setPayments] = useState<any[]>([]);
  const token = () => localStorage.getItem("token");
  const api = async (method: string, url: string) => fetch(url, { method, headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json());
  useEffect(() => { api("GET", "/api/admin/payments").then(setPayments); }, []);
  const confirmPayment = async (id: string) => { await api("POST", `/api/admin/payments/${id}/confirm`); api("GET", "/api/admin/payments").then(setPayments); };
  return (
    <div className="space-y-3">
      {payments.length === 0 && <p className="text-gray-500 text-center py-8">No payment requests.</p>}
      {payments.map((p) => (
        <div key={p.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
          <div>
            <span className="font-medium">{p.userName}</span>
            <span className="text-gray-400 ml-2 text-sm">{p.phone}</span>
            <span className="text-green-600 font-semibold ml-2">{p.plan} (K{p.amount})</span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${p.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span>
          </div>
          {p.status === "pending" && <button onClick={() => confirmPayment(p.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Confirm</button>}
        </div>
      ))}
    </div>
  );
}

function SubjectForm({ initial, onSave, onCancel }: { initial: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || "");
  const [code, setCode] = useState(initial?.code || "");
  const [desc, setDesc] = useState(initial?.description || "");
  const handle = (e: React.FormEvent) => { e.preventDefault(); onSave({ name, code, description: desc }); };
  return (
    <form onSubmit={handle} className="bg-gray-50 p-4 rounded-xl border mb-4 grid grid-cols-4 gap-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject name" className="p-2 border rounded" required />
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g. 4024)" className="p-2 border rounded" required />
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="p-2 border rounded" />
      <div className="flex gap-2">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Save</button>
        <button type="button" onClick={onCancel} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Cancel</button>
      </div>
    </form>
  );
}

function PaperForm({ initial, subjects, subjectId, onSave, onCancel }: { initial: any; subjects: any[]; subjectId: string; onSave: (d: any) => void; onCancel: () => void }) {
  const [sid, setSid] = useState(initial?.subjectId || subjectId);
  const [title, setTitle] = useState(initial?.title || "");
  const [year, setYear] = useState(initial?.year || "");
  const [grade, setGrade] = useState(initial?.grade || "");
  const [examType, setExamType] = useState(initial?.examType || "external");
  const [desc, setDesc] = useState(initial?.description || "");
  const handle = (e: React.FormEvent) => { e.preventDefault(); onSave({ subjectId: sid, title, year: parseInt(year), grade, examType, description: desc }); };
  return (
    <form onSubmit={handle} className="bg-gray-50 p-4 rounded-xl border mb-4 grid grid-cols-3 gap-3">
      <select value={sid} onChange={(e) => setSid(e.target.value)} className="p-2 border rounded" required>
        {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paper title" className="p-2 border rounded" required />
      <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Year" type="number" className="p-2 border rounded" required />
      <select value={grade} onChange={(e) => setGrade(e.target.value)} className="p-2 border rounded" required>
        <option value="">Grade</option>
        <option value="9">9</option>
        <option value="10">10</option>
        <option value="12">12</option>
      </select>
      <select value={examType} onChange={(e) => setExamType(e.target.value)} className="p-2 border rounded">
        <option value="external">External</option>
        <option value="internal">Internal</option>
      </select>
      <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="p-2 border rounded" />
      <div className="flex gap-2 col-span-3">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Save</button>
        <button type="button" onClick={onCancel} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Cancel</button>
      </div>
    </form>
  );
}

function QuestionForm({ initial, onSave, onCancel }: { initial: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [num, setNum] = useState(initial?.questionNumber || "");
  const [text, setText] = useState(initial?.text || "");
  const [marks, setMarks] = useState(initial?.marks || "");
  const [modelAnswer, setModelAnswer] = useState(initial?.modelAnswer || "");
  const [optionsText, setOptionsText] = useState(initial?.options?.join(", ") || "");
  const [generating, setGenerating] = useState(false);
  const token = () => localStorage.getItem("token");
  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const options = optionsText.split(",").map((s: string) => s.trim()).filter(Boolean);
    const type = options.length >= 2 ? "mcq" : "open";
    onSave({ questionNumber: parseInt(num), text, marks: parseInt(marks), modelAnswer, type, options });
  };
  const generateAI = async () => {
    if (!text) return alert("Enter the question text first.");
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (data.answer) setModelAnswer(data.answer);
      else alert(data.error || "Generation failed");
    } finally { setGenerating(false); }
  };
  return (
    <form onSubmit={handle} className="bg-gray-50 p-4 rounded-xl border mb-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="Question number" type="number" className="p-2 border rounded" required />
        <input value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="Marks" type="number" className="p-2 border rounded" required />
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Question text" className="w-full p-2 border rounded" rows={2} required />
      <div>
        <input value={optionsText} onChange={(e) => setOptionsText(e.target.value)} placeholder="Options (comma-separated, e.g. 10, 20, 30, 40) — leave empty for open question" className="w-full p-2 border rounded" />
        <p className="text-xs text-gray-400 mt-1">Multiple choice options. The correct answer must match one of these exactly.</p>
      </div>
      <div>
        <textarea value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} placeholder="Model answer (must be one of the options for MCQ)" className="w-full p-2 border rounded" rows={2} />
        <button type="button" onClick={generateAI} disabled={generating} className="mt-2 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400">
          {generating ? "Generating..." : "🤖 Generate with AI"}
        </button>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Save</button>
        <button type="button" onClick={onCancel} className="text-gray-500 px-4 py-2 text-sm hover:text-gray-700">Cancel</button>
      </div>
    </form>
  );
}
