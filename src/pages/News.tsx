import { useEffect, useState } from "react";
import { renderMarkdown } from "../lib/markdown";
import { usePageTitle } from "../lib/usePageTitle";

export default function News() {
  usePageTitle("News");
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/news").then((r) => r.json()).then(setNews);
  }, []);

  const categories: Record<string, string> = {
    exam: "bg-blue-100 text-blue-700",
    update: "bg-green-100 text-green-700",
    general: "bg-gray-100 text-gray-600",
    tip: "bg-yellow-100 text-yellow-700",
    result: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">News & Updates</h1>
      <p className="text-gray-500 mb-8">Latest updates from the JohnWeb team</p>

      <div className="space-y-4">
        {news.length === 0 && (
          <div className="bg-white p-8 rounded-xl border shadow-sm text-center text-gray-500">
            No news yet. Check back later.
          </div>
        )}
        {news.map((item) => (
          <article key={item.id} className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded capitalize ${categories[item.category] || categories.general}`}>{item.category}</span>
              <span className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{item.title}</h2>
            <div className="text-gray-700 space-y-2" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content) }} />
            <p className="text-xs text-gray-400 mt-3">Posted by {item.author}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
