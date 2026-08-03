import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

interface Paper {
  id: string;
  subjectId: string;
  title: string;
  year: number;
  grade: string;
  examType: string;
  description: string;
  subjectName?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  papers?: Paper[];
}

export default function Browse() {
  usePageTitle("Papers");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/subjects").then((r) => r.json()).then(setSubjects);
  }, []);

  const allPapers: Paper[] = subjects.flatMap((s) =>
    (s.papers || []).map((p) => ({ ...p, subjectName: s.name }))
  );

  const filtered = allPapers.filter((p) => {
    if (selectedSubject && p.subjectId !== selectedSubject) return false;
    if (selectedGrade && p.grade !== selectedGrade) return false;
    if (selectedYear && String(p.year) !== selectedYear) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.subjectName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Past Papers</h1>

      <div className="flex flex-wrap gap-4 mb-8">
        <input
          type="text"
          placeholder="Search papers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
        />
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Grades</option>
          <option value="6">Grade 6</option>
          <option value="7">Grade 7</option>
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Years</option>
          {[2024, 2023, 2022, 2021, 2020].map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((paper) => (
          <Link
            key={paper.id}
            to={`/paper/${paper.id}`}
            className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-green-600 font-semibold uppercase">
                {paper.subjectName} | Grade {paper.grade}
              </div>
              {paper.source === "real" ? (
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase">Real ECZ</span>
              ) : paper.source === "ai" ? (
                <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase">AI</span>
              ) : (
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase">Generated</span>
              )}
            </div>
            <h3 className="font-semibold text-lg">{paper.title}</h3>
            <div className="flex gap-3 mt-2 text-sm text-gray-500">
              <span>{paper.year}</span>
              <span className="capitalize">{paper.examType}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-500 py-8">No papers found.</p>
        )}
      </div>
    </div>
  );
}
