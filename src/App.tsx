import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import PaperDetail from "./pages/PaperDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import Bots from "./pages/Bots";
import Pricing from "./pages/Pricing";
import Teacher from "./pages/Teacher";
import Investor from "./pages/Investor";
import News from "./pages/News";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Teams from "./pages/Teams";
import Quizzes from "./pages/Quizzes";
import QuizDetail from "./pages/QuizDetail";
import Notes from "./pages/Notes";
import Timetable from "./pages/Timetable";
import ForgotPassword from "./pages/ForgotPassword";
import PublicProfile from "./pages/PublicProfile";
import ApiDocs from "./pages/ApiDocs";
import Bookmarks from "./pages/Bookmarks";
import PostNews from "./pages/PostNews";
import Achievements from "./pages/Achievements";
import QuizAnalytics from "./pages/QuizAnalytics";
import BulkImport from "./pages/BulkImport";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/paper/:id" element={<PaperDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/bots" element={<Bots />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/investor" element={<Investor />} />
        <Route path="/news" element={<News />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/quizzes/:id" element={<QuizDetail />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/user/:id" element={<PublicProfile />} />
        <Route path="/api-docs" element={<ApiDocs />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/admin/post-news" element={<PostNews />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/quiz-analytics" element={<QuizAnalytics />} />
        <Route path="/admin/bulk-import" element={<BulkImport />} />
      </Route>
    </Routes>
  );
}
