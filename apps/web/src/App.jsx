import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./pages/Dashboard";
import { WorkoutStudio } from "./pages/WorkoutStudio";
import { FormCheckStudio } from "./pages/FormCheckStudio";
import { AICoachChat } from "./pages/AICoachChat";
import { NutritionTracker } from "./pages/NutritionTracker";
import { ChallengesView } from "./pages/ChallengesView";
import { LeaderboardView } from "./pages/LeaderboardView";
import { GroupsView } from "./pages/GroupsView";
import { ProfileView } from "./pages/ProfileView";

function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, refreshUser, logout } = useAuth();

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard user={user} onNavigate={setActiveTab} />;
      case "workout":
        return <WorkoutStudio onRefreshUser={refreshUser} />;
      case "form-check":
        return <FormCheckStudio />;
      case "coach":
        return <AICoachChat user={user} />;
      case "nutrition":
        return <NutritionTracker />;
      case "challenges":
        return <ChallengesView onRefreshUser={refreshUser} />;
      case "leaderboard":
        return <LeaderboardView user={user} />;
      case "groups":
        return <GroupsView user={user} />;
      case "profile":
        return <ProfileView user={user} onRefreshUser={refreshUser} onLogout={logout} />;
      default:
        return <Dashboard user={user} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        streak={user?.streak_days}
        onLogout={logout}
      />
      <main className="main-content">
        <Header user={user} onRefreshUser={refreshUser} onLogout={logout} />
        {renderActivePage()}
      </main>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/signin" replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/signin" element={<AuthPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
