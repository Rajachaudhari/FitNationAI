import React, { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  Sparkles,
  Flame,
  CheckCircle,
  Plus,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";

export function ChallengesView({ onRefreshUser }) {
  const [challenges, setChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [chData, achData] = await Promise.allSettled([
        api.getChallenges(),
        api.getAchievements(),
      ]);

      if (chData.status === "fulfilled" && Array.isArray(chData.value)) {
        setChallenges(chData.value);
      }
      if (achData.status === "fulfilled" && Array.isArray(achData.value)) {
        setAchievements(achData.value);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleProgress(id) {
    try {
      const res = await api.progressChallenge(id, 1);
      if (res.reward_awarded) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.3 },
        });
      }
      onRefreshUser();
      loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "1.85rem", marginBottom: "4px" }}>Fitness Challenges & XP Rewards</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
          Participate in weekly community sprints, reach unit milestones, and earn verifiable XP badges.
        </p>
      </div>

      {/* Challenges Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>Active Challenges</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
          {challenges.map((c) => {
            const isCompleted = (c.progress || 0) >= c.total_units;
            const progressPercent = Math.min(100, Math.round(((c.progress || 0) / c.total_units) * 100));

            return (
              <div
                key={c.id}
                className="glass-panel"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "18px",
                  borderLeft: isCompleted ? "4px solid var(--accent-emerald)" : "4px solid var(--accent-cyan)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <span className="badge badge-cyan">{c.category || "Fitness"}</span>
                    <span className="badge badge-amber">+{c.reward_points} XP</span>
                  </div>

                  <h4 style={{ fontSize: "1.25rem", marginBottom: "6px" }}>{c.title}</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{c.description}</p>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "8px", fontWeight: 600 }}>
                    <span style={{ color: "var(--text-secondary)" }}>Target Progress</span>
                    <span style={{ color: isCompleted ? "var(--accent-emerald)" : "var(--accent-cyan)" }}>
                      {c.progress} / {c.total_units} {c.unit_label} ({progressPercent}%)
                    </span>
                  </div>

                  <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", overflow: "hidden", marginBottom: "16px" }}>
                    <div
                      style={{
                        width: `${progressPercent}%`,
                        height: "100%",
                        background: isCompleted ? "var(--accent-emerald)" : "var(--accent-cyan)",
                        borderRadius: "var(--radius-full)",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>

                  <button
                    onClick={() => handleProgress(c.id)}
                    disabled={c.reward_claimed}
                    className={c.reward_claimed ? "btn-secondary" : isCompleted ? "btn-primary btn-emerald" : "btn-primary"}
                    style={{ width: "100%", padding: "10px 16px", fontSize: "0.88rem" }}
                  >
                    {c.reward_claimed ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Reward Claimed!</span>
                      </>
                    ) : isCompleted ? (
                      <>
                        <Sparkles size={16} />
                        <span>Claim Reward (+{c.reward_points} XP)</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Advance Progress (+1 {c.unit_label})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>Milestone Badges & Achievements</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="glass-panel"
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                opacity: ach.is_unlocked ? 1 : 0.6,
                border: ach.is_unlocked ? "1px solid rgba(0, 240, 255, 0.3)" : "1px solid var(--card-border)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: ach.is_unlocked ? "rgba(0, 240, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: ach.is_unlocked ? "var(--accent-cyan)" : "var(--text-muted)",
                }}
              >
                {ach.is_unlocked ? <Award size={24} /> : <Lock size={20} />}
              </div>

              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: ach.is_unlocked ? "#fff" : "var(--text-muted)" }}>
                  {ach.title}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {ach.description}
                </div>
                <span className="badge badge-purple" style={{ marginTop: "6px", fontSize: "0.68rem" }}>
                  +{ach.points_reward} XP
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
