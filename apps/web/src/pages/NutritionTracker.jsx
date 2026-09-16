import React, { useState, useEffect } from "react";
import {
  Utensils,
  Plus,
  Sparkles,
  Trash2,
  PieChart,
  Flame,
  CheckCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";

export function NutritionTracker() {
  const [nutrition, setNutrition] = useState({
    date: new Date().toISOString().slice(0, 10),
    meals: [],
    totals: { calories: 1450, protein_g: 110, carbs_g: 155, fat_g: 45 },
  });
  const [aiText, setAiText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [manualMeal, setManualMeal] = useState("lunch");
  const [manualDesc, setManualDesc] = useState("");
  const [manualCal, setManualCal] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [showManualModal, setShowManualModal] = useState(false);

  useEffect(() => {
    loadNutrition();
  }, []);

  async function loadNutrition() {
    try {
      const data = await api.getTodayNutrition();
      if (data) setNutrition(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleAILog(e) {
    e.preventDefault();
    if (!aiText.trim() || aiParsing) return;

    setAiParsing(true);
    try {
      // 1. Natural Language Parse
      const estimate = await api.parseFoodNatural(aiText);

      // 2. Automatically log estimated meal
      await api.logMeal({
        meal: "lunch",
        description: estimate.description,
        calories: estimate.estimated_calories,
        protein_g: estimate.protein_g,
        carbs_g: estimate.carbs_g,
        fat_g: estimate.fat_g,
      });

      setAiText("");
      confetti({ particleCount: 40, spread: 50 });
      loadNutrition();
    } catch (err) {
      alert("Failed to parse meal: " + err.message);
    } finally {
      setAiParsing(false);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    try {
      await api.logMeal({
        meal: manualMeal,
        description: manualDesc,
        calories: Number(manualCal) || 200,
        protein_g: Number(manualProtein) || 10,
        carbs_g: 20,
        fat_g: 5,
      });

      setManualDesc("");
      setManualCal("");
      setManualProtein("");
      setShowManualModal(false);
      loadNutrition();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteMeal(id) {
    try {
      await api.deleteMeal(id);
      loadNutrition();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  }

  const calorieTarget = 2400;
  const proteinTarget = 160;
  const carbsTarget = 250;
  const fatTarget = 65;

  const cal = nutrition.totals?.calories || 0;
  const pro = nutrition.totals?.protein_g || 0;
  const carb = nutrition.totals?.carbs_g || 0;
  const fat = nutrition.totals?.fat_g || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.85rem", marginBottom: "4px" }}>Nutrition & Bio-Fuel</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            Track macronutrient partition, total daily energy expenditure, and AI-estimated food logs.
          </p>
        </div>

        <button onClick={() => setShowManualModal(true)} className="btn-secondary">
          <Plus size={18} />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* AI Quick-Log Bar */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 28px",
          background: "linear-gradient(135deg, rgba(0, 240, 255, 0.07) 0%, rgba(19, 23, 37, 0.9) 100%)",
          border: "1px solid rgba(0, 240, 255, 0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <Sparkles size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-cyan)" }}>
            AI Natural Language Food Parser
          </span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "16px" }}>
          Describe what you ate in natural language (e.g. <i>"2 rotis, bowl of yellow dal and grilled paneer"</i>) and AI will compute macros and log it automatically.
        </p>

        <form onSubmit={handleAILog} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Type your meal description..."
            style={{
              flex: 1,
              minWidth: "260px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-full)",
              padding: "12px 20px",
              color: "#fff",
              outline: "none",
            }}
          />
          <button type="submit" disabled={!aiText.trim() || aiParsing} className="btn-primary">
            <Sparkles size={16} />
            <span>{aiParsing ? "Estimating..." : "Estimate & Log"}</span>
          </button>
        </form>
      </div>

      {/* Macro Breakdown Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        {/* Calories */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>CALORIES</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "4px", color: "var(--accent-amber)" }}>
            {cal} <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>/ {calorieTarget} kcal</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", marginTop: "10px" }}>
            <div style={{ width: `${Math.min(100, Math.round((cal / calorieTarget) * 100))}%`, height: "100%", background: "var(--accent-amber)", borderRadius: "var(--radius-full)" }} />
          </div>
        </div>

        {/* Protein */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>PROTEIN</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "4px", color: "var(--accent-cyan)" }}>
            {pro}g <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>/ {proteinTarget}g</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", marginTop: "10px" }}>
            <div style={{ width: `${Math.min(100, Math.round((pro / proteinTarget) * 100))}%`, height: "100%", background: "var(--accent-cyan)", borderRadius: "var(--radius-full)" }} />
          </div>
        </div>

        {/* Carbs */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>CARBOHYDRATES</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "4px", color: "var(--accent-emerald)" }}>
            {carb}g <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>/ {carbsTarget}g</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", marginTop: "10px" }}>
            <div style={{ width: `${Math.min(100, Math.round((carb / carbsTarget) * 100))}%`, height: "100%", background: "var(--accent-emerald)", borderRadius: "var(--radius-full)" }} />
          </div>
        </div>

        {/* Fat */}
        <div className="glass-panel" style={{ padding: "20px 24px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>HEALTHY FATS</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, marginTop: "4px", color: "var(--accent-rose)" }}>
            {fat}g <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>/ {fatTarget}g</span>
          </div>
          <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", marginTop: "10px" }}>
            <div style={{ width: `${Math.min(100, Math.round((fat / fatTarget) * 100))}%`, height: "100%", background: "var(--accent-rose)", borderRadius: "var(--radius-full)" }} />
          </div>
        </div>
      </div>

      {/* Logged Meals Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>Today's Food Journal</h3>

        {(!nutrition.meals || nutrition.meals.length === 0) ? (
          <div className="glass-panel" style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            No meals logged yet today. Use the AI parser above to describe what you ate!
          </div>
        ) : (
          nutrition.meals.map((m) => (
            <div
              key={m.id}
              className="glass-panel"
              style={{
                padding: "18px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span className="badge badge-purple" style={{ textTransform: "capitalize" }}>
                  {m.meal}
                </span>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{m.description}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {m.protein_g}g Protein • {m.carbs_g || 0}g Carbs • {m.fat_g || 0}g Fat
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-amber)" }}>
                  {m.calories} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>kcal</span>
                </span>
                <button
                  onClick={() => handleDeleteMeal(m.id)}
                  style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "6px" }}
                  title="Delete meal"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
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
          <div className="glass-panel" style={{ maxWidth: "450px", width: "100%", padding: "28px", background: "#10131e" }}>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "18px" }}>Log Meal Item</h3>
            <form onSubmit={handleManualSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Meal Time
                </label>
                <select
                  value={manualMeal}
                  onChange={(e) => setManualMeal(e.target.value)}
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Food Description
                </label>
                <input
                  type="text"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  required
                  placeholder="e.g. Oatmeal with Whey & Berries"
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={manualCal}
                    onChange={(e) => setManualCal(e.target.value)}
                    required
                    placeholder="450"
                    style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    value={manualProtein}
                    onChange={(e) => setManualProtein(e.target.value)}
                    placeholder="35"
                    style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowManualModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Log Food
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
