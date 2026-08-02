import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [xp, setXp] = useState<any>(null);
  const [nextExam, setNextExam] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      fetch("/api/answers/mine", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json()).then(setAnswers);
      fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
      fetch(`/api/gamification/${user.id}`).then((r) => r.json()).then(setXp);
      fetch("/api/timetable?grade=12").then((r) => r.json()).then((d) => setNextExam(d.filter((e: any) => !e.passed)[0]));
    }
  }, [user]);

  if (user) {
    const correct = answers.filter((a) => a.isCorrect).length;
    const totalPapers = subjects.reduce((acc: number, s: any) => acc + (s.papers?.length || 0), 0);
    const recentPapers = subjects.flatMap((s: any) => (s.papers || []).slice(0, 3)).slice(-6);

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {xp && (
              <>
                <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Level {xp.level} · {xp.xp} XP</span>
                <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">🔥 {xp.streak || 0} day streak</span>
                {xp.badges?.map((b: string, i: number) => <span key={i} className="text-sm bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">{b}</span>)}
              </>
            )}
            {nextExam && <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">📅 {nextExam.subject}: {nextExam.daysLeft}d</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{totalPapers}</div>
            <div className="text-sm text-gray-500">Past Papers</div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{answers.length}</div>
            <div className="text-sm text-gray-500">Answers Submitted</div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{correct}</div>
            <div className="text-sm text-gray-500">Correct</div>
          </div>
          <div className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{answers.length ? Math.round((correct / answers.length) * 100) : 0}%</div>
            <div className="text-sm text-gray-500">Score</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Recent Papers</h2>
              <Link to="/browse" className="text-sm text-green-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {recentPapers.reverse().map((p: any) => {
                const sub = subjects.find((s) => s.id === p.subjectId);
                return (
                  <Link key={p.id} to={`/paper/${p.id}`} className="block bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition">
                    <div className="text-xs text-green-600 font-semibold">{sub?.name || "?"} | Grade {p.grade}</div>
                    <div className="font-medium">{p.title} ({p.year})</div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Link to="/profile" className="text-sm text-green-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-2">
              {answers.length === 0 && (
                <div className="bg-white p-6 rounded-lg border text-center text-gray-500">
                  <p className="mb-2">No answers yet.</p>
                  <Link to="/browse" className="text-green-600 hover:underline font-medium">Start practicing</Link>
                </div>
              )}
              {answers.slice(-5).reverse().map((a: any) => (
                <div key={a.id} className={`bg-white p-3 rounded-lg border shadow-sm border-l-4 ${a.isCorrect ? "border-l-green-500" : "border-l-red-400"}`}>
                  <div className="text-xs text-gray-500">{a.paper?.title || "?"} | Q{a.question?.questionNumber || "?"}</div>
                  <div className="text-sm truncate">{a.content}</div>
                  <div className="text-xs mt-1">
                    <span className={a.isCorrect ? "text-green-600" : "text-red-600"}>{a.isCorrect ? "Correct" : "Incorrect"}</span>
                    <span className="text-gray-400 ml-2">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Ready for more practice?</h2>
              <p className="opacity-90">Browse all {totalPapers} past papers across {subjects.length} subjects</p>
            </div>
            <Link to="/browse" className="bg-white text-green-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-100">
              Browse Papers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gradient-to-br from-green-600 via-green-500 to-orange-400 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-4">Zambian Past Papers, Answered.</h1>
          <p className="text-xl mb-8 opacity-90">
            Practice ECZ past papers with model answers. Improve your exam performance.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/browse" className="bg-white text-green-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Browse Past Papers
            </Link>
            <Link to="/register" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {stats && (
        <section className="border-b bg-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div><div className="text-3xl font-bold text-green-600">{(stats.answers || 0).toLocaleString()}</div><div className="text-sm text-gray-500">Answers</div></div>
              <div><div className="text-3xl font-bold text-blue-600">{(stats.questions || 0).toLocaleString()}</div><div className="text-sm text-gray-500">Questions</div></div>
              <div><div className="text-3xl font-bold text-orange-600">{(stats.papers || 0).toLocaleString()}</div><div className="text-sm text-gray-500">Past Papers</div></div>
              <div><div className="text-3xl font-bold text-purple-600">{stats.students || 0}</div><div className="text-sm text-gray-500">Students</div></div>
              <div><div className="text-3xl font-bold text-red-600">{stats.teachers + stats.bots || 0}</div><div className="text-sm text-gray-500">Teachers & Bots</div></div>
            </div>
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold mb-2">Past Papers</h3>
            <p className="text-gray-600">Access ECZ past papers from 2020 to 2024 across all subjects.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="text-lg font-semibold mb-2">Submit Answers</h3>
            <p className="text-gray-600">Write and submit your answers to get immediate feedback.</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="text-3xl mb-3">✅</div>
            <h3 className="text-lg font-semibold mb-2">Model Answers</h3>
            <p className="text-gray-600">Check model answers to understand how to score full marks.</p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">About JohnWeb</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            JohnWeb is a Zambian online platform dedicated to helping students prepare for ECZ examinations.
            We provide past papers with model answers, exam tips, and a community-driven answering system.
          </p>
        </div>
      </section>
    </div>
  );
}
