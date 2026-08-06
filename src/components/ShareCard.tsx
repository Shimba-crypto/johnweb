import { useState } from "react";

interface Props {
  title: string;
  subject?: string;
  grade?: string;
  correct: number;
  attempted: number;
  pct: number;
  userName?: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(c: HTMLCanvasElement, p: Props) {
  c.width = 1080;
  c.height = 1350;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  const emoji = p.pct >= 80 ? "🏆" : p.pct >= 50 ? "🎉" : "💪";

  const grad = ctx.createLinearGradient(0, 0, 0, 1350);
  grad.addColorStop(0, "#0f172a");
  grad.addColorStop(1, "#1e293b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(0, 0, 1080, 16);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // Logo
  ctx.fillStyle = "#16a34a";
  roundRect(ctx, 90, 90, 220, 220, 48);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 150px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("J", 200, 205);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 56px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("JohnWeb", 350, 140);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "30px Arial, sans-serif";
  ctx.fillText("ECZ EXAM PRACTICE", 350, 196);

  // Emoji + score
  ctx.textAlign = "center";
  ctx.font = "160px Arial, sans-serif";
  ctx.fillText(emoji, 540, 430);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 220px Arial, sans-serif";
  ctx.fillText(`${p.pct}%`, 540, 660);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "44px Arial, sans-serif";
  ctx.fillText(`You scored ${p.correct}/${p.attempted} questions correct`, 540, 790);

  // Paper info
  ctx.fillStyle = "#f1f5f9";
  ctx.font = "bold 52px Arial, sans-serif";
  const paperTitle = p.title.length > 42 ? p.title.slice(0, 42) + "…" : p.title;
  ctx.fillText(paperTitle, 540, 920);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "38px Arial, sans-serif";
  const meta = [p.subject, p.grade ? `Grade ${p.grade}` : ""].filter(Boolean).join(" · ");
  ctx.fillText(meta, 540, 985);
  if (p.userName) {
    ctx.font = "34px Arial, sans-serif";
    ctx.fillText(`Practised by ${p.userName}`, 540, 1050);
  }

  // Footer
  ctx.fillStyle = "#16a34a";
  ctx.fillRect(0, 1280, 1080, 70);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Arial, sans-serif";
  ctx.fillText("Try it free: johnweb-qncu.onrender.com", 540, 1317);
  ctx.fillStyle = "#86efac";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText("MADE IN ZAMBIA", 540, 1120);
}

export default function ShareCard(p: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const waText = () => `${p.pct >= 80 ? "🏆" : p.pct >= 50 ? "🎉" : "💪"} I scored ${p.pct}% on "${p.title}" on JohnWeb! ${p.correct}/${p.attempted} correct. Can you beat me? Try it free: https://johnweb-qncu.onrender.com`;

  const doShare = async () => {
    setBusy(true);
    setMsg("");
    try {
      const c = document.createElement("canvas");
      drawCard(c, p);
      const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b || new Blob()), "image/png"));
      const file = new File([blob], "johnweb-score.png", { type: "image/png" });
      if (navigator.share) {
        try {
          await navigator.share({
            files: [file],
            text: waText(),
            title: "My JohnWeb score",
          });
          return;
        } catch (e: any) {
          if (e?.name === "AbortError") return;
        }
      }
      // Fallback: download the card
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "johnweb-score.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      setMsg("Card downloaded — share it on WhatsApp!");
    } catch {
      // Last-resort fallback: WhatsApp text message
      window.open(`https://wa.me/?text=${encodeURIComponent(waText())}`, "_blank");
      setMsg("Opened WhatsApp with your score!");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-center">
      <button
        onClick={doShare}
        disabled={busy}
        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium disabled:opacity-60"
      >
        {busy ? "Preparing…" : "📲 Share my result"}
      </button>
      {msg && <p className="text-sm text-gray-500 mt-2">{msg}</p>}
    </div>
  );
}
