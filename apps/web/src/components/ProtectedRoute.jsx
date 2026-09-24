import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-dark)",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 25px rgba(0, 240, 255, 0.4)",
          }}
        >
          <Zap size={28} color="#05070e" strokeWidth={3} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          <Loader2 size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
          <span>Verifying athlete session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
