import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Investor() {
  usePageTitle("Investor");
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error || !["investor", "admin", "super_admin"].includes(d.role)) navigate("/"); else setUser(d); })
      .catch(() => navigate("/"));
  }, [navigate]);

  useEffect(() => {
    if (user) fetch("/api/investor/analytics", { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }).then((r) => r.json()).then(setData);
  }, [user]);

  if (!user) return <div className="max-w-5xl mx-auto px-4 py-8">Loading...</div>;

  const metrics = [
    { label: "Total Users", value: data?.totalUsers || 0, color: "text-purple-600" },
    { label: "Students", value: data?.totalStudents || 0, color: "text-blue-600" },
    { label: "Teachers", value: data?.totalTeachers || 0, color: "text-green-600" },
    { label: "Subjects", value: data?.totalSubjects || 0, color: "text-orange-600" },
    { label: "Papers", value: data?.totalPapers || 0, color: "text-red-600" },
    { label: "Answers", value: data?.totalAnswers || 0, color: "text-cyan-600" },
    { label: "Active Students", value: data?.activeStudents || 0, color: "text-indigo-600" },
    { label: "Avg Rating", value: data?.avgRating || 0, color: "text-yellow-600" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
      <p className="text-gray-500 mb-8">Platform performance and engagement metrics</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white p-5 rounded-xl border shadow-sm">
            <div className="text-sm text-gray-500">{m.label}</div>
            <div className={`text-2xl font-bold ${m.color}`}>{typeof m.value === "number" ? m.value.toLocaleString() : m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">Users by Role</h3>
          {data?.usersByRole && Object.entries(data.usersByRole).map(([role, count]: any) => (
            <div key={role} className="flex justify-between text-sm mb-2">
              <span className="capitalize">{role.replace("_", " ")}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-semibold mb-4">Engagement</h3>
          <div className="space-y-4">
            <div><div className="flex justify-between text-sm mb-1"><span>Correct answers</span><span className="text-green-600 font-semibold">{data?.engagement?.correct || 0}</span></div><div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${data?.engagement ? (data.engagement.correct / Math.max(data.totalAnswers, 1)) * 100 : 0}%` }} /></div></div>
            <div><div className="flex justify-between text-sm mb-1"><span>Pending review</span><span className="text-yellow-600 font-semibold">{data?.engagement?.pending || 0}</span></div><div className="h-2 bg-gray-100 rounded-full"><div className="h-full bg-yellow-500 rounded-full" style={{ width: `${data?.engagement ? (data.engagement.pending / Math.max(data.totalAnswers, 1)) * 100 : 0}%` }} /></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
