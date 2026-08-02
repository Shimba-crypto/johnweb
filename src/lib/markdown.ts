export function renderMarkdown(md: string): string {
  if (!md) return "";
  let html = escapeHtml(md);

  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs"><code>${code}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, (_, code) => `<code class="bg-gray-100 px-1 rounded text-red-500">${code}</code>`);

  html = html.replace(/^###### (.*)$/gm, "<h6>$1</h6>");
  html = html.replace(/^##### (.*)$/gm, "<h5>$1</h5>");
  html = html.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");

  html = html.replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>");

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-green-600 hover:underline">$1</a>');

  html = html.replace(/\n{2,}/g, "</p><p>");
  html = html.replace(/\n/g, "<br/>");

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
