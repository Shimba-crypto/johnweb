import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-white font-bold mb-3">
              <span className="text-green-400">John</span><span className="text-orange-400">Web</span>
            </h4>
            <p className="text-sm">Zambia's ECZ past paper platform. Practice smarter, score higher.</p>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3 text-sm">Platform</h5>
            <div className="space-y-2 text-sm">
              <Link to="/browse" className="block hover:text-white">Past Papers</Link>
              <Link to="/quizzes" className="block hover:text-white">Quizzes</Link>
              <Link to="/teams" className="block hover:text-white">Study Teams</Link>
              <Link to="/notes" className="block hover:text-white">Notes</Link>
              <Link to="/timetable" className="block hover:text-white">Timetable</Link>
              <Link to="/bots" className="block hover:text-white">AI Bots</Link>
              <Link to="/leaderboard" className="block hover:text-white">Leaderboard</Link>
              <Link to="/pricing" className="block hover:text-white">Pricing</Link>
            </div>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3 text-sm">Company</h5>
            <div className="space-y-2 text-sm">
              <Link to="/about" className="block hover:text-white">About</Link>
              <Link to="/news" className="block hover:text-white">News</Link>
              <Link to="/contact" className="block hover:text-white">Contact</Link>
              <Link to="/terms" className="block hover:text-white">Terms of Service</Link>
              <Link to="/privacy" className="block hover:text-white">Privacy Policy</Link>
            </div>
          </div>
          <div>
            <h5 className="text-white font-semibold mb-3 text-sm">Support</h5>
            <div className="space-y-2 text-sm">
              <Link to="/contact" className="block hover:text-white">Contact Us</Link>
              <Link to="/settings" className="block hover:text-white">Settings</Link>
              <Link to="/register" className="block hover:text-white">Create Account</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>© 2026 JohnWeb. All rights reserved. Not affiliated with ECZ.</p>
          <p className="mt-1">Made in 🇿🇲 Zambia</p>
        </div>
      </div>
    </footer>
  );
}
