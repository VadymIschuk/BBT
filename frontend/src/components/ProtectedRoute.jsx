// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect, useMemo } from "react";

function ProtectedRoute({ children, allow = [] }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const location = useLocation();

  useEffect(() => {
    auth().catch(() => setIsAuthorized(false));
  }, []);

  const refreshToken = async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN);
    if (!refresh) {
      setIsAuthorized(false);
      return;
    }
    try {
      const res = await api.post("api/v1/token/refresh/", { refresh });
      if (res.status === 200) {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.log(error);
      setIsAuthorized(false);
    }
  };

  const auth = async () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (!token) {
      setIsAuthorized(false);
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded?.exp && decoded.exp < now) {
        await refreshToken();
      } else {
        setIsAuthorized(true);
      }
    } catch {
      setIsAuthorized(false);
    }
  };

  const role = useMemo(() => {
    if (!isAuthorized) return null;
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.role || null;
    } catch {
      return null;
    }
  }, [isAuthorized]);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allow.length > 0 && role && !allow.includes(role)) {
    const redirectByRole = {
      analyst: "/analyst",
      hunter: "/app",
    };
    return <Navigate to={redirectByRole[role] || "/login"} replace />;
  }

  return children;
}

export default ProtectedRoute;
