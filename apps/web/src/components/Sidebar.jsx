import React from "react";
import {
  LayoutDashboard,
  Dumbbell,
  ScanEye,
  BotMessageSquare,
  Utensils,
  Trophy,
  Medal,
  Users,
  UserCheck,
  Flame,
  Zap,
} from "lucide-react";

export function Sidebar({ activeTab, setActiveTab, user, streak }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "workout", label: "Workout Studio", icon: Dumbbell },
    { id: "form-check", label: "AI Form Check", icon: ScanEye },
    { id: "coach", label: "AI Fitness Coach", icon: BotMessageSquare },
    { id: "nutrition", label: "Nutrition & Fuel", icon: Utensils },
    { id: "challenges", label: "Challenges & XP", icon: Trophy },
    { id: "leaderboard", label: "Leaderboard", icon: Medal },
    { id: "groups", label: "Community Groups", icon: Users },
    { id: "profile", label: "Athlete Profile", icon: UserCheck },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", paddingLeft: "8px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)",
          }}
        >
          <Zap size={22} color="#05070e" strokeWidth={3} />
        </div>
        <div>
          <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Fit<span style={{ color: "var(--accent-cyan)" }}>Nation</span>
          </span>
          <span style={{ marginLeft: "5px", fontSize: "0.65rem", padding: "2px 6px", borderRadius: "4px", background: "rgba(0,240,255,0.15)", color: "var(--accent-cyan)", fontWeight: 700 }}>
            AI
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isActive ? "rgba(0, 240, 255, 0.1)" : "transparent",
                color: isActive ? "var(--accent-cyan)" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.92rem",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
                textAlign: "left",
                width: "100%",
                borderLeft: isActive ? "3px solid var(--accent-cyan)" : "3px solid transparent",
              }}
            >
              <Icon size={19} color={isActive ? "var(--accent-cyan)" : "#64748b"} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile Pill */}
      <div
        className="glass-panel"
        style={{
          padding: "14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginTop: "auto",
        }}
      >
        <img
          src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
          alt="Athlete Avatar"
          style={{ width: "38px", height: "38px", borderRadius: "var(--radius-full)", objectFit: "cover", border: "2px solid var(--accent-cyan)" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.88rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user?.name || "Vishal Fit"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--accent-emerald)", fontWeight: 600 }}>
              Lvl {user?.level || 1}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "0.72rem", color: "var(--accent-amber)", fontWeight: 600 }}>
              <Flame size={12} /> {streak || 1}d
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
