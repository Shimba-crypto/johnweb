import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  k10: "Starter",
  k20: "Basic",
  k30: "Plus",
  k50: "Pro",
  k100: "Premium",
  k200: "Teacher",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 border-gray-300",
  k10: "bg-green-50 border-green-300",
  k20: "bg-blue-50 border-blue-300",
  k30: "bg-purple-50 border-purple-300",
  k50: "bg-orange-50 border-orange-300",
  k100: "bg-red-50 border-red-300",
  k200: "bg-teal-50 border-teal-300",
};

const BTN_COLORS: Record<string, string> = {
  free: "bg-gray-500",
  k10: "bg-green-600",
  k20: "bg-blue-600",
  k30: "bg-purple-600",
  k50: "bg-orange-600",
  k100: "bg-red-600",
  k200: "bg-teal-600",
};

const BADGES: Record<string, string> = {
  k10: "STARTER",
  k100: "MOST POPULAR",
  k200: "TEACHER'S CHOICE",
};

// Payment happens through the live payment-link flow (auto-grant access code)
const INVOICE_LINKS: Record<string, string> = {
  k10: "S4IR74",
  k20: "H94JHP",
  k30: "SWD87K",
  k100: "H3VMO1",
  k200: "DNLCFN",
};

const DURATION_NOTE: Record<string, string> = {
  k10: "one-time · 30 days",
  k20: "one-time · 30 days",
  k30: "one-time · 30 days",
  k50: "one-time · 30 days",
  k100: "one-time · 1 year",
  k200: "one-time · 1 year",
};

const TRIAL_OPTIONS = [
  { id: "t1d", label: "1 Day" },
  { id: "t3d", label: "3 Days" },
  { id: "t1w", label: "1 Week" },
];

export default function Pricing() {
  usePageTitle("Pricing");
  const [plans, setPlans] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [trialMsg, setTrialMsg] = useState("");

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then(setPlans);
    const u = localStorage.getItem("user");
    if (u) try { setUser(JSON.parse(u)); } catch {}
  }, []);

  const startTrial = async (planId: string) => {
    const token = localStorage.getItem("token");
    if (!token) { alert("Login to start your free trial"); return; }
    const res = await fetch("/api/trial", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan: planId }),
    });
    const d = await res.json();
    if (d.error) { setTrialMsg(d.error); return; }
    setTrialMsg(`✅ ${d.message}`);
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u) {
        u.subscription = d.plan;
        u.subscriptionExpiresAt = d.expiresAt;
        localStorage.setItem("user", JSON.stringify(u));
        setUser(u);
      }
    } catch {}
  };

  const paidPlans = plans.filter((p) => !p.id.startsWith("t") && p.id !== "free" && p.id !== "k50");
  const currentPlan = user?.subscription || "free";
  const hasActive = currentPlan !== "free";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
        <p className="text-gray-500 text-lg">Unlock more features and take your exam prep to the next level</p>
      </div>

      {/* Free trial */}
      <div className="max-w-2xl mx-auto mb-10 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-5 text-white shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-bold text-lg">🎁 Try Premium free</h3>
            <p className="text-sm opacity-90">
              {user?.trialUsed
                ? "You already used your free trial — pick a plan below or buy an access code."
                : "Full premium access, no payment needed. One trial per account."}
            </p>
            {trialMsg && <p className="text-sm font-semibold mt-2">{trialMsg}</p>}
          </div>
          {user && !user.trialUsed && (
            <div className="flex gap-2 flex-wrap">
              {TRIAL_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => startTrial(t.id)}
                  className="bg-white text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {!user && (
            <Link to="/register" className="bg-white text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50">
              Sign up to claim yours
            </Link>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {paidPlans.map((plan, i) => {
          const isCurrent = plan.id === currentPlan;
          const name = PLAN_NAMES[plan.id] || plan.label;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 ${PLAN_COLORS[plan.id] || "bg-white border-gray-200"} ${isCurrent ? "ring-2 ring-green-500" : ""} shadow-sm flex flex-col`}
            >
              {BADGES[plan.id] && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1 rounded-full font-semibold ${plan.id === "k100" ? "bg-gradient-to-r from-purple-600 to-red-600" : "bg-green-600"}`}>
                  {BADGES[plan.id]}
                </div>
              )}
              <div className="text-center mb-4 mt-2">
                <h3 className="text-lg font-bold">{name}</h3>
                <div className="text-3xl font-bold mt-2">
                  {plan.price === 0 ? "Free" : `K${plan.price}`}
                </div>
                {DURATION_NOTE[plan.id] && <div className="text-xs text-gray-500 mt-1">{DURATION_NOTE[plan.id]}</div>}
              </div>
              <ul className="space-y-2 mb-6 flex-1 text-sm">
                {plan.features.map((f: string, fi: number) => (
                  <li key={fi} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {!user ? (
                <Link to="/register" className={`block text-center text-white ${BTN_COLORS[plan.id] || "bg-green-600"} py-2 rounded-lg text-sm font-medium hover:opacity-90`}>
                  Get Started
                </Link>
              ) : isCurrent ? (
                <div className="text-center text-sm text-green-600 font-medium py-2 border-t pt-3">Current Plan</div>
              ) : plan.price > 0 && INVOICE_LINKS[plan.id] ? (
                <div className="space-y-2 border-t pt-3">
                  <Link
                    to={`/invoice/${INVOICE_LINKS[plan.id]}`}
                    className={`block w-full text-center text-white ${BTN_COLORS[plan.id] || "bg-green-600"} py-2 rounded-lg text-sm font-medium hover:opacity-90`}
                  >
                    📱 Pay with Mobile Money
                  </Link>
                  <p className="text-center text-xs text-gray-400">Airtel Money / MTN Mobile Money — instant access</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Active subscription note */}
      {hasActive && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-4 text-center text-sm text-green-700">
          You're on the <b>{PLAN_NAMES[currentPlan] || currentPlan}</b> plan
          {user?.subscriptionExpiresAt && ` — expires ${new Date(user.subscriptionExpiresAt).toLocaleDateString()}`}.
          Need more time? Contact the seller or redeem a code in the{" "}
          <Link to="/redeem" className="font-semibold underline">Redeem Code</Link> page.
        </div>
      )}

      {/* Admin shortcut */}
      {user && ["admin", "super_admin", "omni_super"].includes(user.role) && (
        <div className="mt-10 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Admin: Manage Subscriptions</h3>
          <p className="text-sm text-gray-600 mb-3">Assign subscription plans to users, or create access codes from the Sell page.</p>
          <div className="flex gap-3">
            <Link to="/admin" className="text-green-600 hover:underline text-sm font-medium">Go to Admin Panel →</Link>
            <Link to="/sell" className="text-green-600 hover:underline text-sm font-medium">Go to Sell →</Link>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">All plans include</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
          {[
            { icon: "📚", title: "19 Subjects", text: "Full ECZ curriculum coverage" },
            { icon: "📝", title: "1440+ Questions", text: "With detailed model answers" },
            { icon: "🇿🇲", title: "Zambian-Made", text: "Built for Zambian students" },
          ].map((b) => (
            <div key={b.title} className="bg-white p-4 rounded-xl border shadow-sm">
              <div className="text-2xl mb-2">{b.icon}</div>
              <h4 className="font-semibold">{b.title}</h4>
              <p className="text-sm text-gray-500">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}