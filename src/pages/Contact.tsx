import { useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function Contact() {
  usePageTitle("Contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });
    if (res.ok) { setSent(true); setName(""); setEmail(""); setSubject(""); setMessage(""); }
    else setError("Failed to send message. Try again.");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-8">Have a question, suggestion, or issue? We'd love to hear from you.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-2xl mb-1">📧</div>
          <div className="font-medium">Email</div>
          <div className="text-sm text-gray-500">support@johnweb.com</div>
        </div>
        <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
          <div className="text-2xl mb-1">💬</div>
          <div className="font-medium">Live Chat</div>
          <div className="text-sm text-gray-500">Chat with our bots</div>
        </div>
      </div>

      {sent ? (
        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-xl text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-bold text-lg mb-1">Message Sent!</h3>
          <p>We'll get back to you as soon as possible.</p>
          <button onClick={() => setSent(false)} className="mt-3 text-green-600 hover:underline text-sm">Send another message</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded-lg" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-2 border rounded-lg" rows={5} required />
          </div>
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">Send Message</button>
        </form>
      )}
    </div>
  );
}
