import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function InviteJoin() {
  usePageTitle("Join via Invite");
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "phone" | "paying" | "waiting" | "done">("form");
  const [phone, setPhone] = useState("");
  const [payMsg, setPayMsg] = useState("");
  const [payError, setPayError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [regEmail, setRegEmail] = useState("");

  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then((r) => r.json())
      .then((d) => { if (d.error) setNotFound(true); else setInvite(d); })
      .catch(() => setNotFound(true));
  }, [token]);

  // Poll payment status while waiting for admin confirmation
  useEffect(() => {
    if (step !== "waiting") return;
    const t = setInterval(() => {
      fetch(`/api/invites/${token}/status`).then((r) => r.json()).then((d) => {
        setPaymentStatus(d.paymentStatus);
        if (d.confirmed) {
          clearInterval(t);
          // auto-login with the credentials they registered
          fetch("/api/auth/login", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: regEmail, password }),
          }).then((r) => r.json()).then((loginData) => {
            if (loginData.token) {
              localStorage.setItem("token", loginData.token);
              localStorage.setItem("refreshToken", loginData.refreshToken || "");
              localStorage.setItem("user", JSON.stringify(loginData.user));
              setStep("done");
              setTimeout(() => { window.location.href = "/teacher"; }, 1500);
            }
          });
        }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(t);
  }, [step, token, regEmail, password]);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Passwords do not match.");
    const res = await fetch(`/api/invites/${token}/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Registration failed"); return; }
    setRegEmail(data.email);
    if (data.requiresPayment) { setStep("phone"); }
    else {
      // free invite: auto-login now
      const loginRes = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("refreshToken", loginData.refreshToken || "");
        localStorage.setItem("user", JSON.stringify(loginData.user));
        setStep("done");
        setTimeout(() => { window.location.href = "/browse"; }, 1200);
      } else setStep("done");
    }
  };

  const MERCHANT_NUMBER = "0975876361";

  const pay = async () => {
    setPayError(""); setPayMsg("");
    setStep("paying");
    const res = await fetch(`/api/invites/${token}/pay`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone || MERCHANT_NUMBER }),
    });
    const data = await res.json();
    setStep("waiting");
    setPaymentStatus("pending");
    if (data.error) { setPayError(data.error); setStep("phone"); }
    else setPayMsg(data.message);
  };

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-3">❌</div>
        <h1 className="text-xl font-bold mb-2">Invite not found</h1>
        <p className="text-gray-500 mb-4">This invite link is invalid or has expired.</p>
        <Link to="/" className="text-green-600 hover:underline">Go home</Link>
      </div>
    );
  }

  if (!invite) return <div className="max-w-md mx-auto px-4 py-16 text-center">Loading...</div>;

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎉</div>
        <h1 className="text-2xl font-bold">You're invited to JohnWeb!</h1>
        {invite.teacherName && <p className="text-gray-600 mt-1">From: <strong>{invite.teacherName}</strong></p>}
        {invite.school && <p className="text-gray-500 text-sm">School: <strong>{invite.school}</strong></p>}
        <p className="text-xs text-gray-400 mt-1">Role: {invite.role}</p>
        {invite.price > 0 && (
          <div className="inline-block mt-3 bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded-lg font-semibold">
            💳 This invite costs K{invite.price} · {invite.plan === "k200" ? "K200 Teacher Plan" : invite.plan}
          </div>
        )}
      </div>

      {step === "form" && (
        <form onSubmit={register} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Create a Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 chars, letters + numbers" className="w-full p-2 border rounded-lg" required minLength={8} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full p-2 border rounded-lg" required />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">
            {invite.price > 0 ? `Create Account (K${invite.price})` : "Accept Invite & Join"}
          </button>
          {invite.price > 0 && <p className="text-xs text-gray-400 text-center">Your account activates after payment is confirmed.</p>}
        </form>
      )}

      {step === "phone" && (
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h3 className="font-semibold text-lg text-center">📱 Pay K{invite.price} via Mobile Money</h3>
          <p className="text-sm text-gray-500 text-center">Send K{invite.price} using USSD, then confirm below.</p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div>
              <div className="font-semibold text-sm text-gray-800">🏦 MTN Mobile Money</div>
              <ol className="text-sm text-gray-600 list-decimal pl-5 mt-1 space-y-0.5">
                <li>Dial <strong>*776#</strong></li>
                <li>Choose <strong>Pay Merchant</strong></li>
                <li>Enter merchant number <strong>0975876361</strong></li>
                <li>Enter amount <strong>K{invite.price}</strong> and confirm</li>
              </ol>
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-800">🏦 Airtel Money</div>
              <ol className="text-sm text-gray-600 list-decimal pl-5 mt-1 space-y-0.5">
                <li>Dial <strong>*210#</strong></li>
                <li>Choose <strong>Pay Merchant</strong></li>
                <li>Enter merchant number <strong>0975876361</strong></li>
                <li>Enter amount <strong>K{invite.price}</strong> and confirm</li>
              </ol>
            </div>
          </div>

          {payError && <p className="text-red-600 text-sm">{payError}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Your phone number (optional, for reference)</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 0961234567" className="w-full p-2 border rounded-lg text-center text-lg" />
          </div>
          <button onClick={pay} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium">✅ I've Paid K{invite.price}</button>
          <p className="text-xs text-gray-400 text-center">After paying, tap the button. The admin will confirm and activate your account.</p>
          <button type="button" onClick={() => setStep("form")} className="w-full text-sm text-gray-500 hover:text-gray-700">← Back</button>
        </div>
      )}

      {step === "paying" && (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
          <div className="text-4xl mb-3 animate-pulse">💳</div>
          <p className="font-semibold">Sending payment request...</p>
        </div>
      )}

      {step === "waiting" && (
        <div className="bg-white p-8 rounded-xl border shadow-sm text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h3 className="font-bold text-lg mb-1">Payment sent!</h3>
          <p className="text-sm text-gray-600 mb-2">{payMsg}</p>
          <p className="text-sm text-gray-500 mb-4">Status: <span className="font-semibold text-yellow-600">{paymentStatus}</span></p>
          <div className="inline-flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Waiting for the admin to confirm your payment. This page updates automatically.
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-8 rounded-xl text-center">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="font-bold text-lg mb-1">You're all set!</h3>
          <p className="text-sm">Your account is active. Redirecting you now...</p>
        </div>
      )}
    </div>
  );
}
