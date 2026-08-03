import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Careers() {
  usePageTitle("Career Roadmap");
  const [careers, setCareers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/careers").then((r) => r.json()).then(setCareers);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">🧭 Career Roadmap</h1>
      <p className="text-gray-500 mb-8">Pick your dream job and see which subjects matter most.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {careers.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition">
            <h3 className="font-bold text-lg">{c.career}</h3>
            <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-400 block mb-1">Key subjects:</span>
              <div className="flex flex-wrap gap-1">
                {c.subjects.map((s: string) => (
                  <span key={s} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <span className="text-xs font-medium text-gray-400 block mb-1">Next steps:</span>
              <div className="text-xs text-gray-600">{c.next.join(" → ")}</div>
            </div>
            <Link to="/browse" className="mt-3 inline-block text-sm text-green-600 hover:underline">Practice the subjects →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
