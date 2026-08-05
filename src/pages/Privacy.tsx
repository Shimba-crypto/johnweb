import { usePageTitle } from "../lib/usePageTitle";

export default function Privacy() {
  usePageTitle("Privacy Policy");
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 text-gray-700 text-sm leading-relaxed">
        <p>Last updated: August 2026</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">1. Information We Collect</h2>
        <p>We collect information you provide during registration (name, email, school) and while using the Platform (answers, ratings, quiz results, preferences). For payments, you also provide a mobile money phone number. We collect basic usage data (pages visited) for analytics so we can improve the Platform.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide and improve the Platform</li>
          <li>To personalise your experience</li>
          <li>To process and verify payments and deliver purchased access</li>
          <li>To send notifications about your account, subscriptions, and expirations</li>
          <li>To generate anonymised analytics</li>
          <li>To prevent abuse and enforce terms</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">3. Payments & Phone Numbers</h2>
        <p>When you pay by Airtel Money or MTN Mobile Money, we record your phone number and payment details for that purchase so we can confirm payment and deliver your access code. Payment details are kept only as long as needed for accounting and fraud prevention. We never store your mobile money PIN or password.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">4. Data Storage & Retention</h2>
        <p>Your data is stored securely on our servers. Passwords are stored encrypted (hashed) and can never be read. We keep your account and progress data as long as your account exists. If your subscription or trial expires, your data is kept — nothing is deleted. You may request deletion of your account and data at any time, and we will remove your information within 30 days.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">5. Third-Party Services</h2>
        <p>We do not sell your personal data. We may use third-party AI services (DeepSeek, OpenRouter) for generating model answers when configured. Your study answers may be sent to those services only to generate feedback. Payment links are processed directly between you and us; no third-party payment processor handles your money.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Export your data (CSV download)</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">7. Cookies & Storage</h2>
        <p>We use your device's local storage for authentication tokens, preferences, and to keep you signed in. Push notifications are used only if you choose to enable them. No third-party tracking cookies are used.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">8. Children's Privacy</h2>
        <p>JohnWeb is designed for students preparing for ECZ exams. If a student under 13 uses the Platform, we rely on a parent or guardian to register and supervise the account. We do not knowingly collect more information than needed to provide the service.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">9. Changes to This Policy</h2>
        <p>We may update this policy from time to time. The updated date will be shown at the top of this page.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">10. Contact</h2>
        <p>For privacy concerns, contact us via the <a href="/contact" className="text-green-600 hover:underline">Contact page</a>.</p>
      </div>
    </div>
  );
}