import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Pricing() {
  usePageTitle("Pricing");
  const [plans, setPlans] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetch("/api/pricing").then((r) => r.json()).then(setPlans);
    const u = localStorage.getItem("user");
    if (u) try { setUser(JSON.parse(u)); } catch {}
  }, []);

  const payWithMobileMoney = async (plan: string) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login to subscribe");
    const p = prompt(`Enter your Airtel/MTN phone number (e.g. 0971234567):`);
    if (!p) return;
    const res = await fetch("/api/payments/initiate", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ plan, phone: p }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else alert(`${data.message}\n\nPayment ID: ${data.paymentId}`);
  };

  const currentPlan = user?.subscription || "free";
  const currentIndex = plans.findIndex((p) => p.id === currentPlan);
  const planColors: Record<string, string> = { free: "bg-gray-100 border-gray-300", k10: "bg-green-50 border-green-300", k20: "bg-blue-50 border-blue-300", k30: "bg-purple-50 border-purple-300", k50: "bg-orange-50 border-orange-300", k100: "bg-red-50 border-red-300" };
  const btnColors: Record<string, string> = { free: "bg-gray-500", k10: "bg-green-600", k20: "bg-blue-600", k30: "bg-purple-600", k50: "bg-orange-600", k100: "bg-red-600" };

  return (
    <div className="max-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Choose Your Plan</h1>
        <p className="text-gray-500 text-lg">Unlock more features and take your exam prep to the next level</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 max-6xl mx-auto">
        {plans.map((plan, i) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade = i > currentIndex;
          return (
            <div key={plan.id} className={`relative rounded-2xl border-2 p-6 ${planColors[plan.id] || "bg-white border-gray-200"} ${isCurrent ? "ring-2 ring-green-500" : ""} shadow-sm flex flex-col`}>
              {plan.id === "k50" && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold">POPULAR</div>}
              {plan.id === "k100" && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold">ENTERPRISE</div>}
              {plan.id === "k10" && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-3 py-1 rounded-full font-semibold">STARTER</div>}
              <div className="text-center mb-4 mt-2">
                <h3 className="text-lg font-bold capitalize">{plan.label === "K10" ? "Starter" : plan.label === "K20" ? "Basic" : plan.label === "K30" ? "Premium" : plan.label === "K50" ? "Pro" : plan.label === "K100" ? "Enterprise" : "Free"}</h3>
                <div className="text-3xl font-bold mt-2">
                  {plan.price === 0 ? "Free" : `K${plan.price}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-gray-500">/mo</span>}
                </div>
              </div>
              <ul className="space-y-2 mb-6 flex-1 text-sm">
                {plan.features.map((f: string, fi: number) => (
                  <li key={fi} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {user ? (
                isCurrent ? (
                  <div className="text-center text-sm text-green-600 font-medium py-2 border-t pt-4">Current Plan</div>
                ) : (
                  plan.price > 0 ? (
                    <div className="space-y-2 border-t pt-3">
                      <button onClick={() => payWithMobileMoney(plan.id)} className={`block w-full text-center text-white ${btnColors[plan.id] || "bg-green-600"} py-2 rounded-lg text-sm font-medium hover:opacity-90`}>
                        📱 Pay with Mobile Money
                      </button>
                      <p className="text-center text-xs text-gray-400">Airtel Money / MTN Mobile Money</p>
                    </div>
                  ) : null
                )
              ) : (
                <Link to="/register" className={`block text-center text-white ${btnColors[plan.id] || "bg-green-600"} py-2 rounded-lg text-sm font-medium hover:opacity-90`}>
                  Get Started
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {user?.role === "admin" || user?.role === "super_admin" ? (
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold mb-2">Admin: Manage Subscriptions</h3>
          <p className="text-sm text-gray-600 mb-3">Go to the Users tab in the Admin panel to assign subscription plans to users.</p>
          <Link to="/admin" className="text-green-600 hover:underline text-sm font-medium">Go to Admin Panel →</Link>
        </div>
      ) : null}

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">All plans include</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto text-left">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-2xl mb-2">📚</div>
            <h4 className="font-semibold">18 Subjects</h4>
            <p className="text-sm text-gray-500">Full ECZ curriculum coverage</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-2xl mb-2">📝</div>
            <h4 className="font-semibold">990+ Questions</h4>
            <p className="text-sm text-gray-500">With detailed model answers</p>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-2xl mb-2">🇿🇲</div>
            <h4 className="font-semibold">Zambian-Made</h4>
            <p className="text-sm text-gray-500">Built for Zambian students</p>
          </div>
        </div>
      </div>
    </div>
  );
}
