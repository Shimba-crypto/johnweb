import { useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

const BASE = "https://johnweb-qncu.onrender.com";

const LANGS = [
  { id: "js", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "curl", label: "cURL" },
] as const;
type Lang = (typeof LANGS)[number]["id"];

export default function ApiDocs() {
  usePageTitle("API Docs");
  const [lang, setLang] = useState<Lang>("js");

  const Block = ({ title, desc, samples, response }: { title: string; desc: string; samples: Record<Lang, string>; response?: string }) => (
    <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{desc}</p>
      <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto mb-3">{samples[lang]}</pre>
      {response && (
        <>
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Response</h4>
          <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg text-xs overflow-x-auto">{response}</pre>
        </>
      )}
    </div>
  );

  const samples = {
    stats: {
      js: jsFetch(`const res = await fetch("${BASE}/api/public/stats");
const data = await res.json();
console.log(data);`),
      python: `import requests

res = requests.get("${BASE}/api/public/stats")
print(res.json())`,
      curl: `curl "${BASE}/api/public/stats"`,
    },
    subjects: {
      js: jsFetch(`const res = await fetch("${BASE}/api/public/subjects");
const subjects = await res.json();
subjects.forEach((s) =>
  console.log(s.name, "-", s.papers.length, "papers")
);`),
      python: `import requests

subjects = requests.get("${BASE}/api/public/subjects").json()
for s in subjects:
    print(s["name"], "-", len(s["papers"]), "papers")`,
      curl: `curl "${BASE}/api/public/subjects"`,
    },
    papers: {
      js: jsFetch(`const base = "${BASE}/api/public/papers";
const filters = new URLSearchParams({ grade: "7", year: "2022" });
const res = await fetch(base + "?" + filters);
const papers = await res.json();
papers.forEach((p) =>
  console.log(p.title, "-", p.questionsCount, "questions")
);`),
      python: `import requests

papers = requests.get(
    "${BASE}/api/public/papers",
    params={"grade": "7"},
).json()
for p in papers:
    print(p["title"], "-", p["questionsCount"], "questions")`,
      curl: `curl "${BASE}/api/public/papers?grade=7&year=2022"`,
    },
    paper: {
      js: jsFetch(`const res = await fetch("${BASE}/api/public/papers/paper-058");
const paper = await res.json();
paper.questions.forEach((q) =>
  console.log(q.questionNumber, q.text, "->", q.modelAnswer)
);`),
      python: `import requests

paper = requests.get(
    "${BASE}/api/public/papers/paper-058"
).json()
for q in paper["questions"]:
    print(q["questionNumber"], q["text"])`,
      curl: `curl "${BASE}/api/public/papers/paper-058"`,
    },
    search: {
      js: jsFetch(`const q = "president";
const res = await fetch("${BASE}/api/public/search?q=" + encodeURIComponent(q));
const data = await res.json();
console.log(data.papers.length, "papers,", data.questions.length, "questions");`),
      python: `import requests

data = requests.get(
    "${BASE}/api/public/search",
    params={"q": "president"},
).json()
print(data["papers"], data["questions"])`,
      curl: `curl "${BASE}/api/public/search?q=president"`,
    },
    status: {
      js: jsFetch(`const res = await fetch("${BASE}/api/status");
const status = await res.json();
console.log(status.sites);`),
      python: `import requests

print(requests.get("${BASE}/api/status").json())`,
      curl: `curl "${BASE}/api/status"`,
    },
    chat: {
      js: jsFetch(`const res = await fetch("${BASE}/api/chat/BOT_ID", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message: "Explain photosynthesis for Grade 7" }),
});
console.log(await res.json());`),
      python: `import requests

res = requests.post(
    "${BASE}/api/chat/BOT_ID",
    json={"message": "Explain photosynthesis for Grade 7"},
)
print(res.json()["reply"])`,
      curl: `curl -X POST ${BASE}/api/chat/BOT_ID \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Explain photosynthesis for Grade 7"}'`,
    },
    grade: {
      js: jsFetch(`const res = await fetch("${BASE}/api/bot/grade", {
  method: "POST",
  headers: {
    "Authorization": "Bearer johnbot-YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    answerId: "ANSWER_ID",
    isCorrect: true,
    feedback: "Good job!",
  }),
});
console.log(await res.json());`),
      python: `import requests

API_KEY = "johnbot-YOUR_API_KEY"

res = requests.post(
    "${BASE}/api/bot/grade",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"answerId": "ANSWER_ID", "isCorrect": True,
          "feedback": "Good job!"},
)
print(res.json())`,
      curl: `curl -X POST ${BASE}/api/bot/grade \\
  -H "Authorization: Bearer johnbot-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"answerId": "ANSWER_ID", "isCorrect": true, "feedback": "Good job!"}'`,
    },
    quiz: {
      js: jsFetch(`const res = await fetch("${BASE}/api/bot/quiz", {
  method: "POST",
  headers: {
    "Authorization": "Bearer johnbot-YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ subject: "Mathematics", grade: "7", count: 5 }),
});
const data = await res.json();
data.quiz.forEach((q) => console.log(q.questionNumber, q.text));`),
      python: `import requests

API_KEY = "johnbot-YOUR_API_KEY"

res = requests.post(
    "${BASE}/api/bot/quiz",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"subject": "Mathematics", "grade": "7", "count": 5},
)
for q in res.json()["quiz"]:
    print(q["questionNumber"], q["text"])`,
      curl: `curl -X POST ${BASE}/api/bot/quiz \\
  -H "Authorization: Bearer johnbot-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"subject": "Mathematics", "grade": "7", "count": 5}'`,
    },
    tips: {
      js: `fetch("${BASE}/api/bot/study-tips", {
  method: "POST",
  headers: {
    "Authorization": "Bearer johnbot-YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ subject: "Mathematics" }),
})
  .then((r) => r.json())
  .then((d) => d.tips.forEach((tip) => console.log("•", tip)));`,
      python: `import requests

API_KEY = "johnbot-YOUR_API_KEY"

res = requests.post(
    "${BASE}/api/bot/study-tips",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"subject": "Mathematics"},
)
for tip in res.json()["tips"]:
    print("•", tip)`,
      curl: `curl -X POST ${BASE}/api/bot/study-tips \\
  -H "Authorization: Bearer johnbot-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"subject": "Mathematics"}'`,
    },
    batchGrade: {
      js: `const res = await fetch("${BASE}/api/bot/batch-grade", {
  method: "POST",
  headers: {
    "Authorization": "Bearer johnbot-YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ answerIds: ["A1", "A2", "A3"] }),
});
console.log(await res.json());`,
      python: `import requests

API_KEY = "johnbot-YOUR_API_KEY"

res = requests.post(
    "${BASE}/api/bot/batch-grade",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={"answerIds": ["ANSWER_1", "ANSWER_2", "ANSWER_3"]},
)
print(res.json())`,
      curl: `curl -X POST ${BASE}/api/bot/batch-grade \\
  -H "Authorization: Bearer johnbot-YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"answerIds": ["A1", "A2", "A3"]}'`,
    },
  } as unknown as Record<Lang, string>;

  const respStats = `{
  "subjects": 19,
  "papers": 144,
  "questions": 1440,
  "updatedAt": "2026-08-08T07:24:46.846Z"
}`;

  const respPaper = `{
  "id": "paper-058",
  "title": "G7 ECZ History 2022",
  "grade": "7",
  "questions": [
    {
      "id": "q-575",
      "questionNumber": 5,
      "text": "Who was the first President of Zambia?",
      "marks": 2,
      "options": ["Kenneth Kaunda", "Levy Mwanawasa",
                  "Michael Sata", "Rupiah Banda"],
      "modelAnswer": "Kenneth Kaunda"
    }
  ]
}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
      <p className="text-gray-500 mb-6">
        Use JohnWeb's papers in your own app or website. Free forever.
      </p>

      <div className="flex gap-2 mb-6">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLang(l.id)}
            className={`px-4 py-2 rounded-lg text-sm ${
              lang === l.id
                ? "bg-green-600 text-white"
                : "bg-white border text-gray-600"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-2">Getting Started</h2>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li><b>Public API (free):</b> no key, no login — open to any website or app. Perfect for school projects and your own apps.</li>
          <li><b>Bot API:</b> create a bot in the <a href="/admin" className="text-green-600 font-medium">Admin Panel</a> to get a <code className="bg-gray-100 px-1 rounded">johnbot-*</code> key, then send it in the <code className="bg-gray-100 px-1 rounded">Authorization: Bearer</code> header.</li>
          <li><b>Base URL:</b> <code className="bg-gray-100 px-1 rounded">{BASE}</code></li>
          <li>Rate limits: public = 300 requests/min per IP; bot endpoints 30/min.</li>
        </ul>
      </div>

      <h2 className="text-2xl font-bold mb-4">Public API (no key needed)</h2>

      <Block
        title="GET /api/public/stats"
        desc="Counts everything in the library — how many subjects, papers and questions."
        samples={samples.stats}
        response={respStats}
      />

      <Block
        title="GET /api/public/subjects"
        desc="All subjects with their grade and the list of paper IDs inside each one."
        samples={samples.subjects}
      />

      <Block
        title="GET /api/public/papers"
        desc="List papers. Optional filters: ?subjectId=, ?grade=, ?year=. Each entry includes questionsCount."
        samples={samples.papers}
      />

      <Block
        title="GET /api/public/papers/:id"
        desc="One full paper including all questions, options and model answers. Example: /api/public/papers/paper-058"
        samples={samples.paper}
        response={respPaper}
      />

      <Block
        title="GET /api/public/search"
        desc="Full-text search across paper titles and question text. Returns matched papers and questions. Example: /api/public/search?q=president"
        samples={samples.search}
      />

      <Block
        title="GET /api/status"
        desc="Public status page data: 7 days of availability + latency for every monitored site (fed by the 5-minute monitor)."
        samples={samples.status}
      />

      <h2 className="text-2xl font-bold mb-4 mt-10">Bot API (key needed)</h2>
      <p className="text-sm text-gray-500 mb-4">All bot endpoints need <code className="bg-gray-100 px-1 rounded">Authorization: Bearer johnbot-YOUR_API_KEY</code>.</p>

      <Block title="1. Chat with a Bot" desc="Send a message to a teacher bot and get a reply." samples={samples.chat} />

      <Block title="2. Auto-grade an Answer" desc="Tell the server a student's answer was right or wrong." samples={samples.grade} />

      <Block title="3. Generate a Quiz" desc="Create a fresh quiz for a subject and grade." samples={samples.quiz} />

      <Block title="4. Get AI Study Tips" desc="Ask for study tips for a subject." samples={samples.tips} />

      <Block title="5. Batch Grade Answers" desc="Grade several answers in one call." samples={samples.batchGrade} />

      <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-sm text-gray-700">
        <b>Link to share:</b>{" "}
        <code className="bg-white px-1 rounded">{BASE}/api/public/stats</code> — anyone can open this in a browser too.
      </div>
    </div>
  );
}