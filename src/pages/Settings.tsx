import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<"profile" | "security" | "admin">("profile");
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [siteName, setSiteName] = useState("");
  const [siteDesc, setSiteDesc] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    const t = token();
    if (!t) { navigate("/login"); return; }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => { if (d.error) navigate("/login"); else { setUser(d); setName(d.name); } })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const api = async (method: string, url: string, body?: any) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api("PUT", "/api/auth/profile", { name });
    if (res.error) setMsg(res.error);
    else { setMsg("Profile updated!"); setUser(res); localStorage.setItem("user", JSON.stringify(res)); }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api("POST", "/api/auth/change-password", { currentPassword, newPassword });
    if (res.error) setMsg(res.error);
    else { setMsg("Password changed!"); setCurrentPassword(""); setNewPassword(""); }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api("PUT", "/api/admin/settings", { deepseekApiKey: deepseekKey, openrouterApiKey: openrouterKey, siteName, siteDescription: siteDesc });
    if (res.error) setMsg(res.error);
    else setMsg("Settings saved!");
  };

  const logoutAll = async () => {
    if (!confirm("Log out of ALL devices? This revokes every active session, including this one.")) return;
    const t = localStorage.getItem("token");
    await fetch("/api/auth/logout-all", { method: "POST", headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "super_admin") {
      api("GET", "/api/admin/settings").then((s) => {
        if (!s.error) { setDeepseekKey(s.deepseekApiKey || ""); setOpenrouterKey(s.openrouterApiKey || ""); setSiteName(s.siteName || ""); setSiteDesc(s.siteDescription || ""); }
      });
    }
  }, [user]);

  if (!user) return <div className="max-w-2xl mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}<button onClick={() => setMsg("")} className="float-right font-bold">&times;</button></div>}

      <div className="flex gap-1 mb-6 border-b">
        {(["profile", "security", ...(user.role === "admin" || user.role === "super_admin" ? ["admin"] : [])] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setMsg(""); }} className={`px-4 py-2 text-sm font-medium rounded-t-lg capitalize ${tab === t ? "bg-white border border-b-white -mb-px text-green-700" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "admin" ? "API & Site" : t}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <form onSubmit={saveProfile} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={user.email} disabled className="w-full p-2 border rounded-lg bg-gray-50 text-gray-500" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Save Changes</button>
        </form>
      )}

      {tab === "security" && (
        <div className="space-y-4">
          <form onSubmit={changePassword} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full p-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-2 border rounded-lg" required minLength={6} />
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Change Password</button>
          </form>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-semibold mb-1">Active Sessions</h3>
            <p className="text-sm text-gray-500 mb-3">If you suspect your account was compromised, revoke all sessions immediately. You'll need to log in again.</p>
            <button onClick={logoutAll} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">Log Out of All Devices</button>
          </div>
        </div>
      )}

      {tab === "admin" && (
        <form onSubmit={saveSettings} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Site Name</label>
            <input type="text" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Site Description</label>
            <input type="text" value={siteDesc} onChange={(e) => setSiteDesc(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <hr />
          <h3 className="font-semibold text-lg">AI Model Answer Generation</h3>
          <p className="text-sm text-gray-500">Used in the admin panel to auto-generate model answers for questions.</p>
          <div>
            <label className="block text-sm font-medium mb-1">DeepSeek API Key</label>
            <input type="password" value={deepseekKey} onChange={(e) => setDeepseekKey(e.target.value)} placeholder="sk-..." className="w-full p-2 border rounded-lg font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">OpenRouter API Key (fallback)</label>
            <input type="password" value={openrouterKey} onChange={(e) => setOpenrouterKey(e.target.value)} placeholder="sk-or-..." className="w-full p-2 border rounded-lg font-mono text-sm" />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Save Settings</button>
        </form>
      )}
    </div>
  );
}
