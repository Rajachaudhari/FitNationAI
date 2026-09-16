import React, { useState, useEffect } from "react";
import {
  Flame,
  Footprints,
  Clock,
  Dumbbell,
  ArrowRight,
  BotMessageSquare,
  Trophy,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { api } from "../services/api";

export function Dashboard({ user, onNavigate }) {
  const [activity, setActivity] = useState({ steps: 8420, calories: 510, active_minutes: 52 });
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [actData, workoutData, challengesData] = await Promise.allSettled([
          api.getTodayActivity(),
          api.getTodayWorkout(),
          api.getChallenges(),
        ]);

        if (actData.status === "fulfilled" && actData.value) {
          setActivity(actData.value);
        }
        if (workoutData.status === "fulfilled" && workoutData.value) {
          setTodayWorkout(workoutData.value);
        }
        if (challengesData.status === "fulfilled" && Array.isArray(challengesData.value)) {
          setActiveChallenge(challengesData.value[0]);
        }
      } catch (e) {
        console.error("Failed to load dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  const stepTarget = 10000;
  const calorieTarget = 600;
  const minuteTarget = 60;

  const stepPercent = Math.min(100, Math.round(((activity.steps || 0) / stepTarget) * 100));
  const calPercent = Math.min(100, Math.round(((activity.calories || 0) / calorieTarget) * 100));
  const minPercent = Math.min(100, Math.round(((activity.active_minutes || 0) / minuteTarget) * 100));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* 1. Daily Activity Metrics Rings */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        {/* Steps Card */}
        <div className="glass-panel" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Daily Steps</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "4px", color: "var(--text-primary)" }}>
                {(activity.steps || 0).toLocaleString()}
              </div>
            </div>
            <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(0, 240, 255, 0.12)", color: "var(--accent-cyan)" }}>
              <Footprints size={22} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
            <span>Target: {stepTarget.toLocaleString()}</span>
            <span>{stepPercent}%</span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ width: `${stepPercent}%`, height: "100%", background: "linear-gradient(90deg, #00f0ff, #00b4d8)", borderRadius: "var(--radius-full)", transition: "width 0.8s ease" }} />
          </div>
        </div>

        {/* Calories Card */}
        <div className="glass-panel" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Burned Calories</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "4px", color: "var(--text-primary)" }}>
                {Math.round(activity.calories || 0)} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>kcal</span>
              </div>
            </div>
            <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255, 51, 102, 0.12)", color: "var(--accent-rose)" }}>
              <Flame size={22} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
            <span>Target: {calorieTarget} kcal</span>
            <span>{calPercent}%</span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ width: `${calPercent}%`, height: "100%", background: "linear-gradient(90deg, #ff3366, #ff758c)", borderRadius: "var(--radius-full)", transition: "width 0.8s ease" }} />
          </div>
        </div>

        {/* Active Minutes Card */}
        <div className="glass-panel" style={{ padding: "24px", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>Active Minutes</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "4px", color: "var(--text-primary)" }}>
                {activity.active_minutes || 0} <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>min</span>
              </div>
            </div>
            <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(0, 230, 118, 0.12)", color: "var(--accent-emerald)" }}>
              <Clock size={22} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
            <span>Target: {minuteTarget} min</span>
            <span>{minPercent}%</span>
          </div>
          <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div style={{ width: `${minPercent}%`, height: "100%", background: "linear-gradient(90deg, #00e676, #69f0ae)", borderRadius: "var(--radius-full)", transition: "width 0.8s ease" }} />
          </div>
        </div>
      </div>

      {/* 2. Today's Workout & AI Coach Quick Access Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "24px" }}>
        {/* Workout Card */}
        <div className="glass-panel" style={{ padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span className="badge badge-cyan">Today's Protocol</span>
              <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {todayWorkout?.duration_min || 45} mins
              </span>
            </div>
            <h3 style={{ fontSize: "1.45rem", marginBottom: "8px" }}>
              {todayWorkout?.title || "Hypertrophy Push & Core"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "20px" }}>
              {todayWorkout?.exercises?.length
                ? `${todayWorkout.exercises.length} structured exercises targeting Chest, Shoulders & Triceps`
                : "Personalized AI split designed for your current recovery and hypertrophy target."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={() => onNavigate("workout")}
              className="btn-primary"
              style={{ flex: 1, padding: "12px 20px" }}
            >
              <Dumbbell size={18} />
              <span>Launch Workout</span>
            </button>
            <button
              onClick={() => onNavigate("form-check")}
              className="btn-secondary"
              style={{ padding: "12px 18px" }}
              title="Real-time camera pose check"
            >
              <span>Check Form</span>
            </button>
          </div>
        </div>

        {/* AI Coach Banner */}
        <div
          className="glass-panel"
          style={{
            padding: "28px",
            background: "linear-gradient(145deg, rgba(139, 92, 246, 0.12) 0%, rgba(19, 23, 37, 0.85) 100%)",
            border: "1px solid rgba(139, 92, 246, 0.25)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span className="badge badge-purple">AI Intelligence</span>
            </div>
            <h3 style={{ fontSize: "1.45rem", marginBottom: "8px" }}>AI Fitness Coach</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", marginBottom: "18px" }}>
              "Your squat form and workout consistency are up 18% this week. Would you like suggestions for progressive overload on your next leg day?"
            </p>
          </div>

          <button
            onClick={() => onNavigate("coach")}
            className="btn-secondary"
            style={{
              width: "100%",
              borderColor: "rgba(139, 92, 246, 0.4)",
              color: "#c4b5fd",
            }}
          >
            <BotMessageSquare size={18} />
            <span>Chat with Coach</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 3. Active Challenge Banner */}
      {activeChallenge && (
        <div
          className="glass-panel"
          style={{
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            background: "linear-gradient(135deg, rgba(255, 171, 0, 0.08) 0%, rgba(19, 23, 37, 0.8) 100%)",
            border: "1px solid rgba(255, 171, 0, 0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "rgba(255, 171, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-amber)",
              }}
            >
              <Trophy size={26} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h4 style={{ fontSize: "1.15rem" }}>{activeChallenge.title}</h4>
                <span className="badge badge-amber">+{activeChallenge.reward_points} XP</span>
              </div>
              <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                {activeChallenge.subtitle} • Progress: {activeChallenge.progress} / {activeChallenge.total_units} {activeChallenge.unit_label}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate("challenges")}
            className="btn-secondary"
            style={{ padding: "10px 20px" }}
          >
            <span>View All Challenges</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
