import { usePageTitle } from "../lib/usePageTitle";

export default function Terms() {
  usePageTitle("Terms of Service");
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 text-gray-700 text-sm leading-relaxed">
        <p>Last updated: August 2026</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">1. Acceptance of Terms</h2>
        <p>By accessing and using JohnWeb ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">2. Description of Service</h2>
        <p>JohnWeb provides an online platform for Zambian ECZ past paper practice (Grades 6 and 7), including questions, model answers, answer submission, grading, quizzes, flashcards, exam mode, certificates, and educational resources. The Platform also includes installable apps for Android, Windows, and desktop, plus a USSD version.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">3. User Accounts</h2>
        <p>You are responsible for maintaining the confidentiality of your account credentials and for everything done under your account. You must provide accurate information during registration. One person should hold one account; sharing or reselling accounts is not allowed. Accounts found to be fraudulent, shared, or abusive may be suspended or terminated.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the Platform for any unlawful purpose</li>
          <li>Attempt to bypass subscription or access-code restrictions</li>
          <li>Submit false or misleading answers</li>
          <li>Harass other users or administrators</li>
          <li>Use automated bots without authorization</li>
          <li>Attempt to hack, crack, or damage the Platform</li>
          <li>Claim payment without actually paying (false payment confirmations are treated as fraud and access may be revoked)</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">5. Free Trial</h2>
        <p>New users can start a free trial of premium access for 1 day, 3 days, or 1 week, at the option shown on the Pricing page. Only <b>one free trial per account</b> is allowed. Trials do not require payment. When a trial ends, your account automatically returns to the Free plan — <b>no data, progress, or account content is lost</b>. You can then buy a paid plan or redeem an access code to continue premium features.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">6. Subscriptions, Access Codes & Payments</h2>
        <p><b>Plans.</b> Paid plans (K10, K20, K30, K50, K100, K200) grant premium features for a fixed period (30 days). <b>There is no automatic renewal.</b> When a plan expires, your account automatically returns to Free with all data and progress kept; you renew by paying again or redeeming a new access code.</p>
        <p><b>Payments.</b> Payments are made by Airtel Money or MTN Mobile Money to the number shown on the payment page or invoice link. By confirming a payment you confirm that you actually sent the full amount. False payment confirmations are tracked, and the access granted on the strength of a false confirmation may be revoked.</p>
        <p><b>Access codes.</b> Access codes are personal and may be redeemed once per code. Sharing or reselling codes is not permitted. Codes granted through a payment link remain valid even if the link is later closed.</p>
        <p><b>Refunds.</b> Once a plan or code has been activated, payments are non-refundable. If you believe a payment was made in error, contact us within 7 days and we will review it fairly.</p>
        <p><b>Price changes.</b> The Platform reserves the right to modify pricing with 30 days notice. Existing paid plans are not affected until their period ends.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">7. Content Ownership</h2>
        <p>Past paper questions and model answers are provided for educational purposes. ECZ past papers are the property of the Examinations Council of Zambia. User-submitted answers remain the property of the user but may be used for Platform improvement.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">8. Limitation of Liability</h2>
        <p>JohnWeb is provided "as is" without warranties. We are not responsible for exam results or academic performance. The Platform is a study aid, not a guarantee of success. To the extent permitted by law, our total liability is limited to the amount you paid for your current plan.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">9. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts that violate these terms, without prior notice. When an account is terminated for misuse, paid plans are not refunded. You may close your account at any time by contacting us, and your data can be deleted on request.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">10. Changes to Terms</h2>
        <p>We may update these terms at any time. We will show the updated date at the top of this page. Continued use after changes constitutes acceptance.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">11. Contact</h2>
        <p>For questions about these terms, contact us via the <a href="/contact" className="text-green-600 hover:underline">Contact page</a>.</p>
      </div>
    </div>
  );
}