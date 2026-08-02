import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Teams() {
  usePageTitle("Teams");
  const [teams, setTeams] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) try { setUser(JSON.parse(u)); } catch {}
    fetch("/api/teams").then((r) => r.json()).then(setTeams);
  }, []);

  const token = () => localStorage.getItem("token");

  useEffect(() => {
    if (user) fetch("/api/my-team", { headers: { Authorization: `Bearer ${token()}` } }).then((r) => r.json()).then(setMyTeam);
  }, [user, teams]);

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Login to create a team");
    const res = await fetch("/api/teams", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ name, description: desc }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else { setName(""); setDesc(""); fetch("/api/teams").then((r) => r.json()).then(setTeams); }
  };

  const joinTeam = async (teamId: string) => {
    if (!user) return alert("Login to join");
    const res = await fetch(`/api/teams/${teamId}/join`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    const data = await res.json();
    if (data.error) alert(data.error);
    else fetch("/api/teams").then((r) => r.json()).then(setTeams);
  };

  const leaveTeam = async (teamId: string) => {
    await fetch(`/api/teams/${teamId}/leave`, { method: "POST", headers: { Authorization: `Bearer ${token()}` } });
    fetch("/api/teams").then((r) => r.json()).then(setTeams);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Teams</h1>
      <p className="text-gray-500 mb-8">Form study groups, compete together, learn faster</p>

      {myTeam && (
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{myTeam.name}</h2>
              <p className="opacity-80 text-sm">{myTeam.description}</p>
              <div className="flex gap-4 mt-2 text-sm opacity-90">
                <span>{myTeam.members.length} members</span>
                <span>Team score: {myTeam.score}%</span>
              </div>
            </div>
            <button onClick={() => leaveTeam(myTeam.id)} className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/30">Leave Team</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {myTeam.members.map((m: any) => (
              <div key={m.id} className="bg-white/20 rounded-lg px-3 py-1 text-sm">
                {m.name} ({m.correct}/{m.total})
              </div>
            ))}
          </div>
        </div>
      )}

      {!myTeam && user && (
        <form onSubmit={createTeam} className="bg-white p-4 rounded-xl border shadow-sm mb-8 flex gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" className="flex-1 p-2 border rounded-lg" required />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className="flex-1 p-2 border rounded-lg" />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 whitespace-nowrap">Create Team</button>
        </form>
      )}

      <div className="space-y-3">
        {teams.map((team) => {
          const totalCorrect = team.members.reduce((s: number, m: any) => s + m.correct, 0);
          const total = team.members.reduce((s: number, m: any) => s + m.total, 0);
          const avgScore = total ? Math.round((totalCorrect / total) * 100) : 0;
          return (
            <div key={team.id} className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{team.name}</h3>
                  {team.description && <p className="text-sm text-gray-500">{team.description}</p>}
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{team.members.length} member{team.members.length !== 1 ? "s" : ""}</span>
                    <span>Score: {avgScore}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {team.members.map((m: any) => (
                      <span key={m.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{m.name}</span>
                    ))}
                  </div>
                </div>
                {!myTeam && user && (
                  <button onClick={() => joinTeam(team.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Join</button>
                )}
              </div>
            </div>
          );
        })}
        {teams.length === 0 && <p className="text-center text-gray-500 py-8">No teams yet. Create the first one!</p>}
      </div>
    </div>
  );
}
