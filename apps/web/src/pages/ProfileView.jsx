import React, { useState } from "react";
import { User, Settings, Save, Shield, Download, ClipboardCheck } from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";

export function ProfileView({ user, onRefreshUser }) {
  const [name, setName] = useState(user?.name || "");
  const [age, setAge] = useState(user?.age || 25);
  const [height, setHeight] = useState(user?.height_cm || 178);
  const [weight, setWeight] = useState(user?.weight_kg || 76);
  const [fitnessLevel, setFitnessLevel] = useState(user?.fitness_level || "Intermediate");
  const [goal, setGoal] = useState(user?.goal || "Muscle building");
  const [activityLevel, setActivityLevel] = useState(user?.activity_level || "moderately_active");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Assessment state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [assessStep, setAssessStep] = useState(1);
  const [assessDays, setAssessDays] = useState(4);
  const [assessEquip, setAssessEquip] = useState(["dumbbells", "barbell"]);
  const [assessDuration, setAssessDuration] = useState(45);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({
        name,
        age: Number(age),
        height_cm: Number(height),
        weight_kg: Number(weight),
        fitness_level: fitnessLevel,
        goal,
        activity_level: activityLevel,
      });
      setSavedMsg("Profile successfully updated!");
      onRefreshUser();
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCompleteAssessment() {
    try {
      await api.saveAssessment({
        fitness_level: fitnessLevel,
        goal,
        available_days: assessDays,
        equipment: assessEquip,
        preferred_duration: assessDuration,
      });
      confetti({ particleCount: 70, spread: 60 });
      setShowAssessmentModal(false);
      onRefreshUser();
    } catch (e) {
      alert(e.message);
    }
  }

  function handleExportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fitnation_export_${user?.id || "athlete"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.85rem", marginBottom: "4px" }}>Athlete Profile & Physiological Stats</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            Manage your biometrics, target goals, and personalized fitness assessment parameters.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowAssessmentModal(true)} className="btn-secondary">
            <ClipboardCheck size={18} color="var(--accent-cyan)" />
            <span>Retake Assessment</span>
          </button>
          <button onClick={handleExportData} className="btn-secondary">
            <Download size={16} />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <img
            src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"}
            alt="Profile Avatar"
            style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--accent-cyan)", marginBottom: "16px" }}
          />
          <h3 style={{ fontSize: "1.5rem" }}>{user?.name || "Vishal Fit"}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "16px" }}>{user?.email}</p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
            <span className="badge badge-cyan">Level {user?.level || 1}</span>
            <span className="badge badge-amber">{user?.streak_days || 1} Day Streak</span>
            <span className="badge badge-purple">{user?.points || 0} Total XP</span>
          </div>

          <div style={{ width: "100%", borderTop: "1px solid var(--card-border)", paddingTop: "20px", display: "flex", justifyContent: "space-around" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>HEIGHT</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "2px" }}>{user?.height_cm || 178} cm</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>WEIGHT</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "2px" }}>{user?.weight_kg || 76} kg</div>
            </div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>BMI</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, marginTop: "2px", color: "var(--accent-emerald)" }}>
                {user?.height_cm && user?.weight_kg
                  ? (user.weight_kg / Math.pow(user.height_cm / 100, 2)).toFixed(1)
                  : "24.0"}
              </div>
            </div>
          </div>
        </div>

        {/* Biometrics Form */}
        <div className="glass-panel" style={{ padding: "32px" }}>
          <h3 style={{ fontSize: "1.3rem", marginBottom: "20px" }}>Edit Fitness Parameters</h3>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Experience Level
                </label>
                <select
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                >
                  <option value="Beginner">Beginner (0-1 yr)</option>
                  <option value="Intermediate">Intermediate (1-3 yrs)</option>
                  <option value="Advanced">Advanced (3+ yrs)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Primary Fitness Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                >
                  <option value="Muscle building">Muscle Building</option>
                  <option value="Strength">Max Strength</option>
                  <option value="Weight management">Weight Management</option>
                  <option value="Endurance">Cardio Endurance</option>
                </select>
              </div>
            </div>

            {savedMsg && (
              <div style={{ color: "var(--accent-emerald)", fontSize: "0.88rem", fontWeight: 600 }}>
                {savedMsg}
              </div>
            )}

            <button type="submit" disabled={saving} className="btn-primary" style={{ marginTop: "12px" }}>
              <Save size={18} />
              <span>{saving ? "Saving..." : "Save Biometrics"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Assessment Questionnaire Modal */}
      {showAssessmentModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
            padding: "20px",
          }}
        >
          <div className="glass-panel" style={{ maxWidth: "520px", width: "100%", padding: "32px", background: "var(--modal-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.45rem" }}>Fitness Assessment</h3>
              <span className="badge badge-cyan">Step {assessStep} of 3</span>
            </div>

            {assessStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  How many days per week can you realistically commit to training?
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  {[2, 3, 4, 5].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAssessDays(d)}
                      className={assessDays === d ? "btn-primary" : "btn-secondary"}
                      style={{ padding: "12px", borderRadius: "10px" }}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
                <button onClick={() => setAssessStep(2)} className="btn-primary" style={{ marginTop: "12px" }}>
                  Next Step
                </button>
              </div>
            )}

            {assessStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  What equipment do you have available?
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {["Full Commercial Gym", "Dumbbells & Bench", "Resistance Bands", "Bodyweight Only"].map((eq) => (
                    <div
                      key={eq}
                      onClick={() => {
                        setAssessEquip([eq]);
                      }}
                      className="glass-panel"
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        border: assessEquip.includes(eq) ? "1px solid var(--accent-cyan)" : "1px solid var(--card-border)",
                        background: assessEquip.includes(eq) ? "rgba(0,240,255,0.1)" : "transparent",
                      }}
                    >
                      {eq}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button onClick={() => setAssessStep(1)} className="btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button onClick={() => setAssessStep(3)} className="btn-primary" style={{ flex: 1 }}>
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {assessStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Target session duration preference:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {[30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAssessDuration(mins)}
                      className={assessDuration === mins ? "btn-primary" : "btn-secondary"}
                      style={{ padding: "12px", borderRadius: "10px" }}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button onClick={() => setAssessStep(2)} className="btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button onClick={handleCompleteAssessment} className="btn-primary btn-emerald" style={{ flex: 1 }}>
                    Finalize Assessment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
