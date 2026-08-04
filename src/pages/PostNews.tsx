import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { renderMarkdown } from "../lib/markdown";
import { usePageTitle } from "../lib/usePageTitle";

export default function PostNews() {
  usePageTitle("Post News");
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [posting, setPosting] = useState(false);
  const [msg, setMsg] = useState("");
  const [newsList, setNewsList] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error || d.role !== "super_admin") navigate("/"); else setUser(d); })
      .catch(() => navigate("/"));
    fetch("/api/news").then((r) => r.json()).then(setNewsList);
  }, [navigate]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setMsg("Title and content are required."); return; }
    setPosting(true);
    const t = localStorage.getItem("token");
    const res = await fetch("/api/admin/news", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ title, content, category }),
    });
    const data = await res.json();
    setPosting(false);
    if (data.error) setMsg(data.error);
    else { setMsg("News published!"); setTitle(""); setContent(""); setCategory("general"); fetch("/api/news").then((r) => r.json()).then(setNewsList); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this news item?")) return;
    const t = localStorage.getItem("token");
    await fetch(`/api/admin/news/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
    fetch("/api/news").then((r) => r.json()).then(setNewsList);
  };

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-8">Loading...</div>;

  const categories = ["general", "exam", "update", "tip", "result"];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Post News</h1>
          <p className="text-gray-500">Publish updates for all students · Markdown supported</p>
        </div>
        <Link to="/news" className="text-sm text-gray-500 hover:text-gray-700">View news page →</Link>
      </div>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}<button onClick={() => setMsg("")} className="float-right font-bold">&times;</button></div>}

      <form onSubmit={post} className="bg-white p-6 rounded-xl border shadow-sm mb-8 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ECZ Results Released" className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-lg">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium">Content * (Markdown)</label>
            <button type="button" onClick={() => setPreview(!preview)} className="text-sm text-green-600 hover:underline">{preview ? "✏️ Edit" : "👁️ Preview"}</button>
          </div>
          {preview ? (
            <div className="p-3 border rounded-lg min-h-[200px] prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"# Heading\n\nWrite **bold** or *italic* text.\n\n- List item 1\n- List item 2\n\n`inline code` or ```code blocks```\n\n[link](http://example.com)"}
              className="w-full p-3 border rounded-lg min-h-[250px] font-mono text-sm"
              rows={12}
              required
            />
          )}
          <p className="text-xs text-gray-400 mt-1">Supports: # headings, **bold**, *italic*, - lists, `code`, ```blocks```, [links](url)</p>
        </div>

        <button type="submit" disabled={posting} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 font-medium">
          {posting ? "Publishing..." : "📢 Publish News"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Your Published News ({newsList.length})</h2>
      <div className="space-y-3">
        {newsList.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded capitalize bg-gray-100 text-gray-600">{item.category}</span>
                  <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <div className="prose-sm text-gray-600" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content) }} />
              </div>
              <button onClick={() => remove(item.id)} className="text-red-500 text-sm hover:underline ml-3 shrink-0">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
