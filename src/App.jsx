import { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import "./index.css";

// Lazy Load Pages for Performance
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/Login"));
const UserDashboard = lazy(() => import("./pages/UserDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const VolunteerDashboard = lazy(() => import("./pages/VolunteerDashboard"));
const SpectatorDashboard = lazy(() => import("./pages/SpectatorDashboard"));

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-950 text-indigo-500 font-mono animate-pulse">
    LOADING_MODULES...
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/volunteer" element={<VolunteerDashboard />} />
          <Route path="/spectator" element={<SpectatorDashboard />} />
        </Routes>
      </Suspense>
      <Toaster richColors position="top-center" theme="dark" />
    </Router>
  );
}

export default App;
