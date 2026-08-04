import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

export default function USSD() {
  usePageTitle("USSD Mini App");
  const [screen, setScreen] = useState("Welcome to JohnWeb ECZ\n1. Browse Papers\n2. My Progress\n3. Redeem Code\n0. Exit");
  const [input, setInput] = useState("");
  const [session, setSession] = useState(() => String(Date.now()));
  const [history, setHistory] = useState<string[]>([]);

  const send = async (val: string) => {
    if (!val.trim()) return;
    setHistory((h) => [...h, val]);
    setInput("");
    try {
      const r = await fetch("/api/ussd/json", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, input: val.trim() }),
      });
      const d = await r.json();
      setScreen(d.text.replace(/^CON |^END /, ""));
    } catch {
      setScreen("Network error. Try again.");
    }
  };

  const keypad = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">📱 JohnWeb USSD Mini App</h1>
      <p className="text-sm text-gray-500 mb-4">
        A simulator of our <strong>*123#</strong> service. On a real phone you'd dial the code; here you tap the keypad.
      </p>

      <div className="bg-slate-800 rounded-2xl p-4 shadow-lg mx-auto" style={{ maxWidth: 320 }}>
        <div className="bg-slate-900 rounded-lg p-4 mb-3 text-green-400 font-mono text-sm min-h-[120px] whitespace-pre-wrap">
          {screen}
        </div>
        {history.length > 0 && (
          <div className="text-xs text-slate-500 font-mono mb-2 flex justify-end flex-col items-end gap-1">
            {history.slice(-5).map((h, i) => <span key={i}>{h}</span>)}
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          {keypad.map((k) => (
            <button
              key={k}
              onClick={() => send(k)}
              className="bg-slate-700 text-white py-3 rounded-lg font-bold text-lg hover:bg-slate-600 active:bg-slate-500"
            >
              {k}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setSession(String(Date.now())); setScreen("Welcome to JohnWeb ECZ\n1. Browse Papers\n2. My Progress\n3. Redeem Code\n0. Exit"); setHistory([]); }}
          className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm"
        >
          Restart Session
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        Dial <strong>*123#</strong> on your phone to try the real thing (coming soon with a USSD provider).
      </p>
    </div>
  );
}
