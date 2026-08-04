import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function NotFound() {
  usePageTitle("Not Found");
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-4 font-bold text-green-600">404</div>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">Go Home</Link>
        <Link to="/browse" className="bg-white border px-6 py-2 rounded-lg hover:bg-gray-50 font-medium">Browse Papers</Link>
      </div>
    </div>
  );
}
