import { useState } from "react";

export default function ApiDocs() {
  const [lang, setLang] = useState<"curl" | "python">("python");

  const block = (title: string, code: string) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-1">{title}</h4>
      <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto">{code}</pre>
    </div>
  );

  const py = (code: string) => lang === "python" ? block(titleFor(code), code) : null;
  const titleFor = (_: string) => "Example";

  const curlChat = `curl -X POST http://localhost:3000/api/chat/BOT_ID \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Explain photosynthesis"}'`;

  const pyChat = `import requests

# Chat with a teacher bot
res = requests.post(
    "http://localhost:3000/api/chat/BOT_ID",
    json={"message": "Explain photosynthesis for Grade 7"},
)
print(res.json()["reply"])`;

  const curlGrade = `curl -X POST http://localhost:3000/api/bot/grade \\
  -H "Authorization: Bearer johnbot-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"answerId": "ANSWER_ID", "isCorrect": true, "feedback": "Good job!"}'`;

  const pyGrade = `import requests

API_KEY = "johnbot-YOUR_API_KEY"

# Auto-grade a student answer
res = requests.post(
    "http://localhost:3000/api/bot/grade",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"answerId": "ANSWER_ID", "isCorrect": True, "feedback": "Good job!"},
)
print(res.json())`;

  const curlQuiz = `curl -X POST http://localhost:3000/api/bot/quiz \\
  -H "Authorization: Bearer johnbot-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"subject": "Mathematics", "grade": "7", "count": 5}'`;

  const pyQuiz = `import requests

API_KEY = "johnbot-YOUR_API_KEY"

# Generate a quiz
res = requests.post(
    "http://localhost:3000/api/bot/quiz",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"subject": "Mathematics", "grade": "7", "count": 5},
)
for q in res.json()["quiz"]:
    print(q["questionNumber"], q["text"])`;

  const curlTips = `curl -X POST http://localhost:3000/api/bot/study-tips \\
  -H "Authorization: Bearer johnbot-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"subject": "Mathematics"}'`;

  const pyTips = `import requests

API_KEY = "johnbot-YOUR_API_KEY"

# Get AI study tips
res = requests.post(
    "http://localhost:3000/api/bot/study-tips",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"subject": "Mathematics"},
)
for tip in res.json()["tips"]:
    print("•", tip)`;

  const curlBatch = `curl -X POST http://localhost:3000/api/bot/batch-grade \\
  -H "Authorization: Bearer johnbot-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"answerIds": ["A1", "A2", "A3"]}'`;

  const pyBatch = `import requests

API_KEY = "johnbot-YOUR_API_KEY"

# Grade multiple answers at once
res = requests.post(
    "http://localhost:3000/api/bot/batch-grade",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"answerIds": ["ANSWER_1", "ANSWER_2", "ANSWER_3"]},
)
print(res.json())`;

  const pyGetPapers = `import requests

# Public endpoint - no auth needed
papers = requests.get(
    "http://localhost:3000/api/papers",
    params={"grade": "7"},
).json()
for p in papers:
    print(p["title"], p["year"])`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
      <p className="text-gray-500 mb-4">Integrate with JohnWeb using bot API keys</p>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setLang("python")} className={`px-4 py-2 rounded-lg text-sm ${lang === "python" ? "bg-green-600 text-white" : "bg-white border text-gray-600"}`}>Python</button>
        <button onClick={() => setLang("curl")} className={`px-4 py-2 rounded-lg text-sm ${lang === "curl" ? "bg-green-600 text-white" : "bg-white border text-gray-600"}`}>cURL</button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-2">Getting Started</h2>
        <p className="text-sm text-gray-600 mb-4">1. Create a bot in the <a href="/admin" className="text-green-600">Admin Panel</a> to get a <code className="bg-gray-100 px-1 rounded">johnbot-*</code> API key.<br />2. Use the key in the <code className="bg-gray-100 px-1 rounded">Authorization</code> header.<br />3. Public endpoints need no key.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4">Bot API Endpoints</h2>

        {block("1. Chat with a Bot", lang === "python" ? pyChat : curlChat)}
        {block("2. Auto-grade an Answer", lang === "python" ? pyGrade : curlGrade)}
        {block("3. Generate a Quiz", lang === "python" ? pyQuiz : curlQuiz)}
        {block("4. Get AI Study Tips", lang === "python" ? pyTips : curlTips)}
        {block("5. Batch Grade Answers", lang === "python" ? pyBatch : curlBatch)}
        {block("6. Fetch Papers (Public)", lang === "python" ? pyGetPapers : `curl "http://localhost:3000/api/papers?grade=7"`)}
      </div>
    </div>
  );
}
