import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import SpectatorDashboard from "./pages/SpectatorDashboard";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import { Toaster } from "sonner";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/volunteer" element={<VolunteerDashboard />} />
        <Route path="/spectator" element={<SpectatorDashboard />} />
      </Routes>
      <Toaster richColors position="top-center" theme="dark" />

    </Router>
  );
}

export default App;
