import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StarRating from "../components/StarRating";
import FollowButton from "../components/FollowButton";
import { usePageTitle } from "../lib/usePageTitle";
import { renderMarkdown } from "../lib/markdown";

export default function Bots() {
  usePageTitle("AI Tutors");
  const [bots, setBots] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [chatBot, setChatBot] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ratingMap, setRatingMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) try { setUser(JSON.parse(u)); } catch {}
    fetch("/api/bots").then((r) => r.json()).then(setBots);
    if (u) {
      const userData = JSON.parse(u);
      fetch(`/api/ratings/${userData.id}`).then((r) => r.json()).then((d) => {
        const m: Record<string, number> = {};
        d.ratings?.forEach((r: any) => { m[r.raterId] = r.score; });
        setRatingMap(m);
      });
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !chatBot || !user) return;
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/chat/${chatBot.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.reply || data.error || "No response" }]);
    } finally { setSending(false); }
  };

  const rateBot = async (botId: string, score: number) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login to rate");
    await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetId: botId, score, targetType: "teacher" }),
    });
    setRatingMap((prev) => ({ ...prev, [botId]: score }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Teacher Bots</h1>
      <p className="text-gray-500 mb-8">Get help from AI tutors or let them grade your answers</p>

      {!chatBot ? (
        <div className="grid md:grid-cols-2 gap-4">
          {bots.map((bot) => (
            <div key={bot.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{bot.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">🤖 Bot</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-yellow-500">{bot.rating > 0 ? bot.rating.toFixed(1) : "—"} ★</div>
                  <div className="text-xs text-gray-400">{bot.ratingCount} ratings</div>
                </div>
              </div>
              {bot.description && <p className="text-sm text-gray-500 mb-2">{bot.description}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {(bot.subjects || []).map((s: string) => <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>)}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setChatBot(bot); setMessages([]); }} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex-1">Chat</button>
                <FollowButton targetId={bot.id} />
                {user && (
                  <StarRating value={ratingMap[bot.id] || 0} onChange={(s) => rateBot(bot.id, s)} size="md" />
                )}
              </div>
            </div>
          ))}
          {bots.length === 0 && <p className="col-span-full text-center text-gray-500 py-8">No bots available yet. Admin can create them.</p>}
        </div>
      ) : (
        <div>
          <button onClick={() => setChatBot(null)} className="text-gray-500 hover:text-gray-700 text-sm mb-4">← Back to bots</button>
          <div className="bg-white rounded-xl border shadow-sm">
            <div className="p-4 border-b bg-gray-50 rounded-t-xl font-semibold">Chat with {chatBot.name}</div>
            <div className="p-4 h-80 overflow-y-auto space-y-3">
              {messages.length === 0 && <p className="text-center text-gray-400 py-8">Ask a question about your ECZ studies...</p>}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg text-sm ${m.role === "user" ? "bg-green-600 text-white whitespace-pre-wrap" : "bg-gray-100 text-gray-800 prose prose-sm"}`}>
                    {m.role === "bot" ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} /> : m.text}
                  </div>
                </div>
              ))}
              {sending && <div className="text-center text-gray-400 text-sm">Thinking...</div>}
            </div>
            <div className="p-4 border-t flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type your question..." className="flex-1 p-2 border rounded-lg" />
              <button onClick={sendMessage} disabled={sending || !user} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300">Send</button>
            </div>
            {!user && <p className="px-4 pb-3 text-xs text-gray-400"><Link to="/login" className="text-green-600 hover:underline">Login</Link> to chat with bots</p>}
          </div>
        </div>
      )}
    </div>
  );
}
