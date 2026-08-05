import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Library() {
  usePageTitle("Library");
  const { id } = useParams<{ id: string }>();
  const [books, setBooks] = useState<any[]>([]);
  const [book, setBook] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [q, setQ] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/library").then((r) => r.json()).then((d) => {
      setBooks(Array.isArray(d) ? d : []);
      setSubjects([...new Set((Array.isArray(d) ? d : []).map((b: any) => b.subject))].sort());
    });
  }, []);

  useEffect(() => {
    if (!id) { setBook(null); return; }
    fetch(`/api/library/${id}`).then((r) => r.json()).then((d) => { if (!d.error) setBook(d); });
  }, [id]);

  // If we're viewing a single book
  if (book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/library" className="text-sm text-green-600 hover:underline mb-4 inline-block">← Back to Library</Link>
        <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
          <div className="text-4xl mb-2">{book.cover || "📖"}</div>
          <h1 className="text-2xl font-bold mb-1">{book.title}</h1>
          <p className="text-sm text-gray-500 mb-1">{book.subject}{book.grade ? ` · Grade ${book.grade}` : ""} · by {book.author}</p>
          <p className="text-gray-600 mt-3">{book.description}</p>
        </div>
        <div className="space-y-4">
          {(book.sections || []).map((s: any, i: number) => (
            <div key={i} className="bg-white p-6 rounded-xl border shadow-sm">
              <h2 className="text-lg font-bold text-green-700 mb-2">{i + 1}. {s.heading}</h2>
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{s.body}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/library" className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">More Books</Link>
        </div>
      </div>
    );
  }

  const filtered = books.filter((b) => (!subject || b.subject === subject) && (!grade || String(b.grade) === grade) && (!q || (b.title + " " + b.description).toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">📚 Study Library</h1>
        <p className="text-gray-500">Free study books and revision guides for Zambian students — no login needed.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books..." className="p-2 border rounded-lg text-sm w-48" />
        <select value={subject} onChange={(e) => setSubject(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="">All subjects</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="">All grades</option>
          <option value="6">Grade 6</option>
          <option value="7">Grade 7</option>
        </select>
      </div>

      {filtered.length === 0 && <p className="text-center text-gray-500 py-10">No books found. Check back soon!</p>}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((b: any) => (
          <Link key={b.id} to={`/library/${b.id}`} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition">
            <div className="text-3xl mb-2">{b.cover || "📖"}</div>
            <h3 className="font-semibold text-lg leading-tight mb-1">{b.title}</h3>
            <p className="text-xs text-green-600 font-medium mb-2">{b.subject}{b.grade ? ` | Grade ${b.grade}` : ""}</p>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{b.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>By {b.author}</span>
              <span className="text-green-600 font-medium">Read →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
