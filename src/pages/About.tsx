import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function About() {
  usePageTitle("About");
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">
          <span className="text-green-600">John</span><span className="text-orange-500">Web</span>
        </h1>
        <p className="text-gray-500 text-lg">Zambia's ECZ Past Paper Platform</p>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 text-gray-700 text-sm leading-relaxed mb-6">
        <h2 className="text-xl font-bold text-gray-900">Our Mission</h2>
        <p>JohnWeb was created to help Zambian students prepare for ECZ examinations by providing access to past papers with model answers, AI-powered tutoring, and a community-driven learning environment.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-6">What We Offer</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-3">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">📚 Past Papers</h3>
            <p className="text-gray-600 mt-1">18 subjects, 234 papers, 990+ real ECZ questions</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">🤖 AI Tutors</h3>
            <p className="text-gray-600 mt-1">Teacher bots powered by DeepSeek AI</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800">✅ Model Answers</h3>
            <p className="text-gray-600 mt-1">Detailed answers to check your work</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-800">📊 Analytics</h3>
            <p className="text-gray-600 mt-1">Track your progress and improve</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 mt-6">Our Story</h2>
        <p>Founded by Tr-John-X, JohnWeb was born from the need for accessible, high-quality exam preparation resources for Zambian students. We believe every student deserves the tools to succeed, regardless of their background or location.</p>

        <h2 className="text-xl font-bold text-gray-900 mt-6">Why JohnWeb?</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Built by Zambians, for Zambians</li>
          <li>Covers all major ECZ subjects</li>
          <li>Grades 9, 10, and 12</li>
          <li>Free basic access for all students</li>
          <li>AI-powered learning assistance</li>
          <li>Community ratings and reviews</li>
        </ul>
      </div>

      <div className="text-center">
        <Link to="/browse" className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700">
          Start Practicing Now
        </Link>
      </div>
    </div>
  );
}
