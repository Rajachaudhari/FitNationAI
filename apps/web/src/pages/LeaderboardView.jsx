import React, { useState, useEffect } from "react";
import { Medal, Trophy, Crown, Flame, Sparkles } from "lucide-react";
import { api } from "../services/api";

export function LeaderboardView({ user }) {
  const [scope, setScope] = useState("global");
  const [leaders, setLeaders] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [scope, user]);

  async function loadLeaderboard() {
    try {
      setLoading(true);
      const data = await api.getLeaderboard(scope);
      if (data) {
        setLeaders(data.leaders || []);
        setUserRank(data.user_rank || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const topThree = leaders.slice(0, 3);
  const restLeaders = leaders.slice(3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.85rem", marginBottom: "4px" }}>Athlete Leaderboard</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            Compete across college, city, and global fitness ranks based on verified training XP.
          </p>
        </div>

        {/* Scope Tabs */}
        <div style={{ display: "flex", background: "var(--bg-tertiary)", padding: "4px", borderRadius: "var(--radius-full)", border: "1px solid var(--card-border)" }}>
          {[
            { id: "global", label: "Global" },
            { id: "college", label: "College" },
            { id: "city", label: "City" },
            { id: "state", label: "State" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setScope(tab.id)}
              style={{
                background: scope === tab.id ? "var(--accent-cyan)" : "transparent",
                color: scope === tab.id ? "#05070e" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.85rem",
                padding: "8px 18px",
                borderRadius: "var(--radius-full)",
                border: "none",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {topThree.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
            alignItems: "flex-end",
          }}
        >
          {/* 2nd Place */}
          {topThree[1] && (
            <div
              className="glass-panel"
              style={{
                padding: "24px",
                textAlign: "center",
                borderTop: "4px solid #94a3b8",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <img
                  src={topThree[1].avatar_url}
                  alt={topThree[1].name}
                  style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", border: "2px solid #94a3b8" }}
                />
                <span style={{ position: "absolute", bottom: "-6px", right: "-6px", background: "#94a3b8", color: "#000", fontWeight: 900, borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>
                  2
                </span>
              </div>
              <h4 style={{ fontSize: "1.1rem" }}>{topThree[1].name}</h4>
              <div style={{ color: "var(--accent-cyan)", fontWeight: 800, marginTop: "4px" }}>
                {topThree[1].points} XP
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          {topThree[0] && (
            <div
              className="glass-panel"
              style={{
                padding: "32px 24px",
                textAlign: "center",
                borderTop: "4px solid var(--accent-amber)",
                background: "linear-gradient(180deg, rgba(255, 171, 0, 0.12) 0%, rgba(19, 23, 37, 0.9) 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                boxShadow: "0 10px 40px rgba(255, 171, 0, 0.15)",
              }}
            >
              <Crown size={28} color="var(--accent-amber)" style={{ marginBottom: "6px" }} />
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <img
                  src={topThree[0].avatar_url}
                  alt={topThree[0].name}
                  style={{ width: "85px", height: "85px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--accent-amber)" }}
                />
                <span style={{ position: "absolute", bottom: "-6px", right: "-6px", background: "var(--accent-amber)", color: "#000", fontWeight: 900, borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem" }}>
                  1
                </span>
              </div>
              <h4 style={{ fontSize: "1.3rem" }}>{topThree[0].name}</h4>
              <div style={{ color: "var(--accent-amber)", fontWeight: 800, fontSize: "1.2rem", marginTop: "4px" }}>
                {topThree[0].points} XP
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {topThree[2] && (
            <div
              className="glass-panel"
              style={{
                padding: "24px",
                textAlign: "center",
                borderTop: "4px solid #cd7f32",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", marginBottom: "12px" }}>
                <img
                  src={topThree[2].avatar_url}
                  alt={topThree[2].name}
                  style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", border: "2px solid #cd7f32" }}
                />
                <span style={{ position: "absolute", bottom: "-6px", right: "-6px", background: "#cd7f32", color: "#000", fontWeight: 900, borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>
                  3
                </span>
              </div>
              <h4 style={{ fontSize: "1.1rem" }}>{topThree[2].name}</h4>
              <div style={{ color: "var(--accent-cyan)", fontWeight: 800, marginTop: "4px" }}>
                {topThree[2].points} XP
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table List */}
      <div className="glass-panel" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {leaders.map((athlete) => {
            const isMe = athlete.is_current_user;
            return (
              <div
                key={athlete.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  borderRadius: "12px",
                  background: isMe ? "rgba(0, 240, 255, 0.12)" : "rgba(255,255,255,0.02)",
                  border: isMe ? "1px solid rgba(0, 240, 255, 0.4)" : "1px solid transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span
                    style={{
                      width: "28px",
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: athlete.rank <= 3 ? "var(--accent-amber)" : "var(--text-muted)",
                      textAlign: "center",
                    }}
                  >
                    #{athlete.rank}
                  </span>
                  <img
                    src={athlete.avatar_url}
                    alt={athlete.name}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: isMe ? "var(--accent-cyan)" : "#fff" }}>
                      {athlete.name} {isMe && "(You)"}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      Level {athlete.level} • {athlete.streak_days} Day Streak
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--accent-cyan)" }}>
                  {athlete.points} XP
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
