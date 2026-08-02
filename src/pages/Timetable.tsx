import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Timetable() {
  usePageTitle("Timetable");
  const [exams, setExams] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const url = filter ? `/api/timetable?grade=${filter}` : "/api/timetable";
    fetch(url).then((r) => r.json()).then(setExams);
  }, [filter]);

  const nextExam = exams.filter((e) => !e.passed)[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">ECZ Exam Timetable</h1>
      <p className="text-gray-500 mb-8">2026 examination schedule</p>

      {nextExam && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8">
          <div className="text-sm opacity-80">Next Exam</div>
          <div className="text-2xl font-bold">{nextExam.subject}</div>
          <div className="text-lg">{new Date(nextExam.date).toLocaleDateString("en-ZM", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at {nextExam.time}</div>
          <div className="text-4xl font-bold mt-2">{nextExam.daysLeft} days left</div>
          <div className="text-sm opacity-80 mt-1">Grade {nextExam.grade}</div>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {["", "9", "10", "12"].map((g) => (
          <button key={g} onClick={() => setFilter(g)} className={`px-4 py-2 rounded-lg text-sm ${filter === g ? "bg-green-600 text-white" : "bg-white border text-gray-600 hover:bg-gray-50"}`}>
            {g ? `Grade ${g}` : "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 text-sm font-medium text-gray-500">
          <div className="col-span-2">Subject</div>
          <div>Grade</div>
          <div>Date</div>
          <div className="text-right">Status</div>
        </div>
        {exams.map((e, i) => (
          <div key={i} className={`grid grid-cols-5 gap-4 p-4 border-b last:border-b-0 items-center ${e.passed ? "opacity-50" : "hover:bg-gray-50"}`}>
            <div className="col-span-2 font-medium">{e.subject}</div>
            <div className="text-gray-500">Grade {e.grade}</div>
            <div className="text-gray-600 text-sm">{new Date(e.date).toLocaleDateString("en-ZM", { month: "short", day: "numeric" })} {e.time}</div>
            <div className="text-right">
              {e.passed ? <span className="text-xs text-gray-400">Passed</span> : <span className="text-xs font-semibold text-orange-600">{e.daysLeft}d left</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
