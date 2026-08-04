import { usePageTitle } from "../lib/usePageTitle";

export default function Terms() {
  usePageTitle("Terms of Service");
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 text-gray-700 text-sm leading-relaxed">
        <p>Last updated: January 2026</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">1. Acceptance of Terms</h2>
        <p>By accessing and using JohnWeb ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">2. Description of Service</h2>
        <p>JohnWeb provides an online platform for Zambian ECZ past paper practice, including questions, model answers, answer submission, grading, and educational resources.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. Accounts found to be fraudulent may be terminated.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the Platform for any unlawful purpose</li>
          <li>Attempt to bypass subscription restrictions</li>
          <li>Submit false or misleading answers</li>
          <li>Harass other users or administrators</li>
          <li>Use automated bots without authorization</li>
          <li>Attempt to hack, crack, or damage the Platform</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">5. Subscriptions & Payments</h2>
        <p>Subscription plans (K10, K20, K30, K50, K100) provide access to premium features. All payments are non-refundable. The Platform reserves the right to modify pricing with 30 days notice.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">6. Content Ownership</h2>
        <p>Past paper questions and model answers are provided for educational purposes. ECZ past papers are the property of the Examinations Council of Zambia. User-submitted answers remain the property of the user but may be used for Platform improvement.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">7. Limitation of Liability</h2>
        <p>JohnWeb is provided "as is" without warranties. We are not responsible for exam results or academic performance. The Platform is a study aid, not a guarantee of success.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">8. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts that violate these terms, without prior notice.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">9. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use after changes constitutes acceptance.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">10. Contact</h2>
        <p>For questions about these terms, contact us via the <a href="/contact" className="text-green-600 hover:underline">Contact page</a>.</p>
      </div>
    </div>
  );
}
