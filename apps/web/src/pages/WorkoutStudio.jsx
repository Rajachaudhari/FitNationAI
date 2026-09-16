import React, { useState, useEffect } from "react";
import {
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Circle,
  Clock,
  Zap,
  Info,
  ChevronRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";

export function WorkoutStudio({ onRefreshUser }) {
  const [workout, setWorkout] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genFocus, setGenFocus] = useState("Full Body");
  const [genDuration, setGenDuration] = useState(45);
  const [genGoal, setGenGoal] = useState("Muscle building");
  const [completedExercises, setCompletedExercises] = useState({});
  const [sessionFinished, setSessionFinished] = useState(false);

  useEffect(() => {
    loadWorkout();
  }, []);

  // Timer interval effect
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  async function loadWorkout() {
    try {
      const data = await api.getTodayWorkout();
      if (data) {
        setWorkout(data);
        const map = {};
        (data.exercises || []).forEach((e) => {
          map[e.id] = e.is_done;
        });
        setCompletedExercises(map);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggle(exerciseId) {
    const nextState = !completedExercises[exerciseId];
    setCompletedExercises((prev) => ({ ...prev, [exerciseId]: nextState }));
    try {
      await api.toggleExerciseDone(exerciseId, nextState);
    } catch (e) {
      console.error("Toggle error:", e);
    }
  }

  async function handleGenerateAIWorkout(e) {
    e.preventDefault();
    try {
      setGenerating(true);
      const newPlan = await api.generateWorkout({
        focus: genFocus,
        duration_min: Number(genDuration),
        goal: genGoal,
      });
      setWorkout(newPlan);
      const map = {};
      (newPlan.exercises || []).forEach((ex) => {
        map[ex.id] = false;
      });
      setCompletedExercises(map);
      setShowGenModal(false);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      alert("Failed to generate workout: " + err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleFinishSession() {
    try {
      const res = await api.completeWorkoutSession({
        duration_sec: (workout?.duration_min || 45) * 60,
        calories: 320,
      });

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.3 },
      });

      setSessionFinished(true);
      onRefreshUser();
      setTimeout(() => setSessionFinished(false), 4000);
    } catch (e) {
      alert(e.message);
    }
  }

  const exercises = workout?.exercises || [];
  const completedCount = Object.values(completedExercises).filter(Boolean).length;
  const progressPercent = exercises.length ? Math.round((completedCount / exercises.length) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Top Banner & AI Generator Action */}
      <div
        className="glass-panel"
        style={{
          padding: "28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          background: "var(--workout-banner-bg)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span className="badge badge-cyan">{workout?.difficulty || "Intermediate"}</span>
            <span className="badge badge-purple">{workout?.split_type || "Strength & Hypertrophy"}</span>
          </div>
          <h2 style={{ fontSize: "1.85rem", marginBottom: "4px" }}>
            {workout?.title || "Hypertrophy Push & Core Protocol"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            {exercises.length} Exercises • {workout?.duration_min || 45} Minutes Target Duration
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button onClick={() => setShowGenModal(true)} className="btn-secondary">
            <Sparkles size={18} color="var(--accent-cyan)" />
            <span>Generate New AI Workout</span>
          </button>
          <button
            onClick={handleFinishSession}
            disabled={exercises.length === 0}
            className="btn-primary btn-emerald"
          >
            <CheckCircle size={18} />
            <span>{sessionFinished ? "Session Completed! +50 XP" : "Complete Workout (+50 XP)"}</span>
          </button>
        </div>
      </div>

      {/* Progress & Rest Timer Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Progress Tracker Card */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)" }}>
              Workout Completion
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-emerald)" }}>
              {completedCount} / {exercises.length} Exercises ({progressPercent}%)
            </span>
          </div>
          <div style={{ width: "100%", height: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))",
                borderRadius: "var(--radius-full)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Rest Timer Widget */}
        <div className="glass-panel" style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>INTER-SET REST TIMER</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-cyan)", fontFamily: "monospace" }}>
              {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, "0")}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setTimerActive(!timerActive)}
              className="btn-secondary"
              style={{ padding: "10px 14px", borderRadius: "12px" }}
            >
              {timerActive ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={() => {
                setTimerActive(false);
                setTimerSeconds(60);
              }}
              className="btn-secondary"
              style={{ padding: "10px 14px", borderRadius: "12px" }}
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => {
                setTimerActive(false);
                setTimerSeconds(90);
              }}
              className="btn-secondary"
              style={{ padding: "8px 12px", borderRadius: "12px", fontSize: "0.8rem" }}
            >
              90s
            </button>
          </div>
        </div>
      </div>

      {/* Exercises List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>Protocol Exercises</h3>

        {exercises.map((ex, index) => {
          const isDone = !!completedExercises[ex.id];
          return (
            <div
              key={ex.id || index}
              className="glass-panel"
              onClick={() => handleToggle(ex.id)}
              style={{
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                borderLeft: isDone ? "4px solid var(--accent-emerald)" : "4px solid transparent",
                opacity: isDone ? 0.7 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ color: isDone ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                  {isDone ? <CheckCircle size={24} /> : <Circle size={24} />}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      textDecoration: isDone ? "line-through" : "none",
                      color: isDone ? "var(--text-muted)" : "var(--text-primary)",
                    }}
                  >
                    {ex.name}
                  </div>
                  <div style={{ fontSize: "0.86rem", color: "var(--accent-cyan)", marginTop: "2px" }}>
                    {ex.detail || `${ex.sets || 3} sets × ${ex.reps || 10} reps`}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span className="badge badge-cyan" style={{ fontSize: "0.75rem" }}>
                  {ex.rest_seconds || 60}s rest
                </span>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Workout Generator Modal */}
      {showGenModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "500px",
              width: "100%",
              padding: "32px",
              background: "var(--modal-bg)",
              border: "1px solid var(--accent-cyan)",
              boxShadow: "0 0 40px rgba(0, 240, 255, 0.2)",
            }}
          >
            <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>AI Workout Architect</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "24px" }}>
              Configure your physiological parameters to generate a custom strength routine.
            </p>

            <form onSubmit={handleGenerateAIWorkout} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Focus Muscle Group
                </label>
                <select
                  value={genFocus}
                  onChange={(e) => setGenFocus(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--bg-tertiary)",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--card-border)",
                    outline: "none",
                  }}
                >
                  <option value="Full Body">Full Body Conditioning</option>
                  <option value="Upper Body">Upper Body Hypertrophy</option>
                  <option value="Lower Body">Lower Body & Quad Focus</option>
                  <option value="Core">Core Stability & Abs</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Duration (Minutes)
                </label>
                <select
                  value={genDuration}
                  onChange={(e) => setGenDuration(Number(e.target.value))}
                  style={{
                    width: "100%",
                    background: "var(--bg-tertiary)",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--card-border)",
                    outline: "none",
                  }}
                >
                  <option value={30}>30 Minutes (Express HIIT/Strength)</option>
                  <option value={45}>45 Minutes (Standard Hypertrophy)</option>
                  <option value={60}>60 Minutes (High Volume Power)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Primary Fitness Objective
                </label>
                <select
                  value={genGoal}
                  onChange={(e) => setGenGoal(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--bg-tertiary)",
                    color: "#fff",
                    padding: "12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--card-border)",
                    outline: "none",
                  }}
                >
                  <option value="Muscle building">Muscle Building (Hypertrophy)</option>
                  <option value="Strength">Maximal Strength (Power)</option>
                  <option value="Weight management">Fat Loss & Conditioning</option>
                  <option value="Endurance">Muscular Endurance</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  <Sparkles size={18} />
                  <span>{generating ? "Architecting..." : "Generate Plan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
