import React, { useState, useEffect } from "react";
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
import { api } from "./services/api";

export function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      setLoading(true);
      const profile = await api.getProfile();
      setUser(profile);
    } catch (err) {
      console.warn("Could not load user profile, syncing default dev user...");
      try {
        const synced = await api.syncUser({ name: "Alex Fit" });
        setUser(synced);
      } catch (e) {
        console.error("User sync error:", e);
      }
    } finally {
      setLoading(false);
    }
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard user={user} onNavigate={setActiveTab} />;
      case "workout":
        return <WorkoutStudio onRefreshUser={fetchUserProfile} />;
      case "form-check":
        return <FormCheckStudio />;
      case "coach":
        return <AICoachChat user={user} />;
      case "nutrition":
        return <NutritionTracker />;
      case "challenges":
        return <ChallengesView onRefreshUser={fetchUserProfile} />;
      case "leaderboard":
        return <LeaderboardView user={user} />;
      case "groups":
        return <GroupsView user={user} />;
      case "profile":
        return <ProfileView user={user} onRefreshUser={fetchUserProfile} />;
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
      />
      <main className="main-content">
        <Header user={user} onRefreshUser={fetchUserProfile} />
        {renderActivePage()}
      </main>
    </div>
  );
}

export default App;
