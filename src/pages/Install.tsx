import { useEffect, useState } from "react";
import { usePageTitle } from "../lib/usePageTitle";

type Platform = "android" | "windows" | "macos" | "linux" | "ios" | "other";

function detectOS(): Platform {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/windows|win64|win32/i.test(ua)) return "windows";
  if (/mac os x|macintosh/i.test(ua)) return "macos";
  if (/linux/i.test(ua)) return "linux";
  return "other";
}

const INSTALLERS: Record<Platform, { file?: string; label: string; desc: string; btn: string; note?: string } | null> = {
  android: { file: "/install/johnweb.apk", label: "JohnWeb for Android", desc: "APK file for Android phones and tablets (Android 5+)", btn: "Download APK", note: "After downloading, open the file and allow installation from unknown sources." },
  windows: { file: "/installers/johnweb-setup-windows.exe", label: "JohnWeb for Windows", desc: "Windows installer (EXE) for PC and laptop", btn: "Download Installer", note: "Run the installer, then launch JohnWeb from your desktop." },
  macos: null,
  linux: { label: "JohnWeb for Linux", desc: "Run JohnWeb as a web app or install the Kali/Linux package", btn: "Open JohnWeb", note: "Linux desktop packages are available on request. For now, add the site to your browser's apps or use the web version." },
  ios: { label: "JohnWeb for iPhone/iPad", desc: "Install as a home-screen app (PWA)", btn: "Install App", note: "In Safari, tap Share → Add to Home Screen. JohnWeb works fully offline." },
  other: { label: "JohnWeb Web App", desc: "Use JohnWeb in any browser on any device", btn: "Open JohnWeb", note: "You can also install it as an app from the browser menu." },
};

export default function Install() {
  usePageTitle("Install JohnWeb");
  const [os, setOs] = useState<Platform>("other");
  const [copied, setCopied] = useState(false);

  useEffect(() => { setOs(detectOS()); }, []);

  const info = INSTALLERS[os];
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const osLabel: Record<Platform, string> = { android: "📱 Android", windows: "🖥️ Windows", macos: "🍎 macOS", linux: "🐧 Linux", ios: "📱 iPhone / iPad", other: "🌐 Web" };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Install JohnWeb</h1>
        <p className="text-gray-500">Get the JohnWeb app on your device — offline-ready ECZ past papers, quizzes and AI tutors.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm mb-6">
        <p className="text-sm text-gray-500 mb-3">Detected your device:</p>
        <div className="text-2xl font-bold text-green-700 mb-4">{osLabel[os]}</div>

        {info ? (
          <div>
            <h2 className="text-xl font-bold mb-2">{info.label}</h2>
            <p className="text-gray-600 mb-4">{info.desc}</p>
            {info.file ? (
              <a
                href={info.file}
                download
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700"
              >
                ⬇️ {info.btn}
              </a>
            ) : (
              <a href="/" className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700">
                {info.btn}
              </a>
            )}
            {info.note && <p className="text-xs text-gray-400 mt-3">{info.note}</p>}
          </div>
        ) : (
          <p className="text-gray-600">No installer for {osLabel[os]} yet. Use the web version below or pick another device.</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {(["android", "windows", "linux", "ios"] as Platform[]).map((p) => {
          const i = INSTALLERS[p];
          if (!i) return null;
          return (
            <button
              key={p}
              onClick={() => { setOs(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`text-left p-4 rounded-xl border shadow-sm hover:shadow-md transition ${os === p ? "border-green-500 bg-green-50" : "bg-white"}`}
            >
              <div className="font-semibold">{osLabel[p]}</div>
              <div className="text-sm text-gray-500">{i.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border">
        <h3 className="font-semibold mb-2">📤 Share JohnWeb</h3>
        <p className="text-sm text-gray-500 mb-3">Send this link to friends, teachers and parents so they can install the app too.</p>
        <div className="flex gap-2">
          <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} className="flex-1 p-2 border rounded-lg bg-white text-sm" />
          <button onClick={copyLink} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{copied ? "✓ Copied" : "Copy"}</button>
        </div>
        <p className="text-xs text-gray-400 mt-3">💡 Tip: On a phone, the browser will offer "Add to Home Screen" — this works offline after your first visit.</p>
      </div>
    </div>
  );
}
