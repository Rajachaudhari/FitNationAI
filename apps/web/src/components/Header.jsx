import React, { useState, useEffect } from "react";
import { Flame, Sparkles, Bell, RefreshCw, Sun, Moon } from "lucide-react";
import confetti from "canvas-confetti";
import { api, setAuthToken } from "../services/api";

export function Header({ user, onRefreshUser }) {
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("fitnation_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fitnation_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleClaimStreak = async () => {
    try {
      setClaiming(true);
      const res = await api.claimDailyStreak();
      if (!res.already_claimed) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.2 },
          colors: ["#00f0ff", "#00e676", "#ffab00"],
        });
        setClaimStatus(`+${res.points_awarded} XP Claimed!`);
      } else {
        setClaimStatus("Already claimed today!");
      }
      onRefreshUser();
      setTimeout(() => setClaimStatus(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setClaiming(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "32px",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
          {todayStr}
        </div>
        <h1 style={{ fontSize: "1.85rem", color: "var(--text-primary)", fontWeight: 800 }}>
          {getGreeting()},{" "}
          <span style={{ background: "linear-gradient(135deg, var(--text-primary) 0%, var(--accent-cyan) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {user?.name || "Athlete"}
          </span>
        </h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="glass-panel"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 14px",
            borderRadius: "var(--radius-full)",
            cursor: "pointer",
            border: "1px solid var(--card-border)",
            background: theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
            color: "var(--text-primary)",
            fontWeight: 600,
            fontSize: "0.85rem",
            transition: "all var(--transition-fast)",
          }}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <>
              <Sun size={17} color="var(--accent-amber)" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon size={17} color="var(--accent-cyan)" />
              <span>Dark</span>
            </>
          )}
        </button>

        {/* Streak Button */}
        <button
          onClick={handleClaimStreak}
          disabled={claiming}
          className="glass-panel"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-full)",
            cursor: "pointer",
            border: "1px solid rgba(255, 171, 0, 0.3)",
            background: "rgba(255, 171, 0, 0.08)",
            color: "var(--accent-amber)",
            fontWeight: 700,
            fontSize: "0.88rem",
          }}
          title="Click to claim daily streak bonus!"
        >
          <Flame size={18} color="var(--accent-amber)" />
          <span>{claimStatus || `${user?.streak_days || 1} Day Streak`}</span>
        </button>

        {/* XP Points Counter */}
        <div
          className="glass-panel"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "var(--radius-full)",
            border: "1px solid rgba(0, 240, 255, 0.3)",
            background: "rgba(0, 240, 255, 0.08)",
            color: "var(--accent-cyan)",
            fontWeight: 800,
            fontSize: "0.88rem",
          }}
        >
          <Sparkles size={16} />
          <span>{user?.points || 0} XP</span>
        </div>

        {/* Evaluation User Switcher */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === "alpha") {
              setAuthToken("dev-token:user-alpha:alpha@fitnation.ai:Alpha Athlete");
            } else if (val === "beta") {
              setAuthToken("dev-token:user-beta:beta@fitnation.ai:Beta Athlete");
            } else {
              setAuthToken("dev-token:alex-fit:alex@fitnation.ai:Alex Fit");
            }
            onRefreshUser();
          }}
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            border: "1px solid var(--card-border)",
            padding: "8px 12px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="alex">Athlete: Alex Fit</option>
          <option value="alpha">Athlete: Alpha User</option>
          <option value="beta">Athlete: Beta User</option>
        </select>
      </div>
    </header>
  );
}
