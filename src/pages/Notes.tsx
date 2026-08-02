import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Notes() {
  usePageTitle("Notes");
  const [notes, setNotes] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { navigate("/login"); return; }
    const u = localStorage.getItem("user");
    if (u) try { setUser(JSON.parse(u)); } catch {}
    fetch("/api/notes", { headers: { Authorization: `Bearer ${t}` } }).then((r) => r.json()).then(setNotes);
  }, [navigate]);

  const api = async (method: string, url: string, body?: any) => {
    const t = localStorage.getItem("token");
    return fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) { await api("PUT", `/api/notes/${editingId}`, { title, content, subject }); setEditingId(null); }
    else { await api("POST", "/api/notes", { title, content, subject }); }
    setTitle(""); setContent(""); setSubject("");
    api("GET", "/api/notes").then(setNotes);
  };

  const edit = (note: any) => { setTitle(note.title); setContent(note.content); setSubject(note.subject); setEditingId(note.id); };
  const remove = async (id: string) => { if (!confirm("Delete this note?")) return; await api("DELETE", `/api/notes/${id}`); api("GET", "/api/notes").then(setNotes); };

  if (!user) return <div className="max-w-4xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Study Notes</h1>
      <p className="text-gray-500 mb-8">Write and organize your revision notes</p>

      <form onSubmit={save} className="bg-white p-4 rounded-xl border shadow-sm mb-8 space-y-3">
        <h3 className="font-semibold">{editingId ? "Edit Note" : "New Note"}</h3>
        <div className="flex gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="flex-1 p-2 border rounded-lg" required />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)" className="w-40 p-2 border rounded-lg" />
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your notes here..." className="w-full p-3 border rounded-lg min-h-[120px]" rows={5} />
        <div className="flex gap-2">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">{editingId ? "Update" : "Save Note"}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setTitle(""); setContent(""); setSubject(""); }} className="text-gray-500 px-4 py-2 text-sm">Cancel</button>}
        </div>
      </form>

      {notes.length === 0 && <p className="text-center text-gray-500 py-8">No notes yet. Create your first study note above!</p>}
      <div className="grid md:grid-cols-2 gap-3">
        {notes.map((note) => (
          <div key={note.id} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="font-semibold">{note.title}</h3>
                {note.subject && <span className="text-xs text-green-600">{note.subject}</span>}
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => edit(note)} className="text-blue-600 hover:underline">Edit</button>
                <button onClick={() => remove(note.id)} className="text-red-600 hover:underline">Del</button>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">{note.content}</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(note.updatedAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
