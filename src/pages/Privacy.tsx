export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 text-gray-700 text-sm leading-relaxed">
        <p>Last updated: January 2026</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">1. Information We Collect</h2>
        <p>We collect information you provide during registration (name, email) and while using the Platform (answers, ratings, preferences). We also collect basic usage data for analytics.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">2. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide and improve the Platform</li>
          <li>To personalize your experience</li>
          <li>To communicate updates and notifications</li>
          <li>To generate anonymized analytics</li>
          <li>To prevent abuse and enforce terms</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">3. Data Storage</h2>
        <p>Your data is stored securely on our servers. We use industry-standard encryption for passwords and sensitive data.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">4. Third-Party Services</h2>
        <p>We do not sell your personal data. We may use third-party AI services (DeepSeek, OpenRouter) for generating model answers when configured by the administrator.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Export your data (CSV download)</li>
        </ul>

        <h2 className="text-lg font-bold text-gray-900 mt-6">6. Cookies</h2>
        <p>We use localStorage for authentication tokens and preferences. No third-party tracking cookies are used.</p>

        <h2 className="text-lg font-bold text-gray-900 mt-6">7. Contact</h2>
        <p>For privacy concerns, contact us via the <a href="/contact" className="text-green-600 hover:underline">Contact page</a>.</p>
      </div>
    </div>
  );
}
