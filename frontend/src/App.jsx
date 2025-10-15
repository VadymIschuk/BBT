import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Analyst from "./pages/Analyst";

export default function App() {
  return (
    <Routes>
      {/* публічні сторінки */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* захищені сторінки (children-based ProtectedRoute) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allow={["hunter"]}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute allow={["hunter"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyst"
        element={
          <ProtectedRoute allow={["analyst"]}>
            <Analyst />
          </ProtectedRoute>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
