import React, { useState, useEffect } from "react";
import { Users, Plus, UserPlus, LogOut, Shield } from "lucide-react";
import { api } from "../services/api";

export function GroupsView({ user }) {
  const [myGroups, setMyGroups] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      setLoading(true);
      const [mine, discover] = await Promise.allSettled([
        api.getUserGroups(),
        api.getDiscoverGroups(),
      ]);
      if (mine.status === "fulfilled" && Array.isArray(mine.value)) {
        setMyGroups(mine.value);
      }
      if (discover.status === "fulfilled" && Array.isArray(discover.value)) {
        setDiscoverGroups(discover.value);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    try {
      await api.createGroup({ name, description: desc, is_private: false });
      setName("");
      setDesc("");
      setShowCreateModal(false);
      loadGroups();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleJoin(id) {
    try {
      await api.joinGroup(id);
      loadGroups();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleLeave(id) {
    try {
      await api.leaveGroup(id);
      loadGroups();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.85rem", marginBottom: "4px" }}>Community Fitness Groups</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            Train alongside your college team, city runners, or calisthenics crew.
          </p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus size={18} />
          <span>Create Fitness Group</span>
        </button>
      </div>

      {/* My Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>My Joined Crews</h3>

        {myGroups.length === 0 ? (
          <div className="glass-panel" style={{ padding: "28px", textAlign: "center", color: "var(--text-muted)" }}>
            You haven't joined any groups yet. Explore discoverable teams below!
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
            {myGroups.map((g) => (
              <div key={g.id} className="glass-panel" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <img
                    src={g.avatar_url || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200"}
                    alt={g.name}
                    style={{ width: "54px", height: "54px", borderRadius: "14px", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{g.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                      <span className="badge badge-cyan" style={{ fontSize: "0.7rem" }}>
                        Role: {g.role || "Member"}
                      </span>
                      {g.invite_code && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Code: {g.invite_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{g.description}</p>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => handleLeave(g.id)}
                    className="btn-secondary"
                    style={{ padding: "6px 14px", fontSize: "0.8rem", color: "var(--accent-rose)" }}
                  >
                    <LogOut size={14} />
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discover Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>Discover Public Communities</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
          {discoverGroups.map((g) => {
            const isAlreadyJoined = myGroups.some((mg) => mg.id === g.id);
            return (
              <div key={g.id} className="glass-panel" style={{ padding: "22px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" }}>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <img
                    src={g.avatar_url || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200"}
                    alt={g.name}
                    style={{ width: "54px", height: "54px", borderRadius: "14px", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{g.name}</div>
                    <span className="badge badge-purple" style={{ fontSize: "0.7rem", marginTop: "4px" }}>
                      Public Community
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>{g.description}</p>

                <button
                  onClick={() => handleJoin(g.id)}
                  disabled={isAlreadyJoined}
                  className={isAlreadyJoined ? "btn-secondary" : "btn-primary"}
                  style={{ width: "100%", padding: "10px" }}
                >
                  <UserPlus size={16} />
                  <span>{isAlreadyJoined ? "Already Joined" : "Join Crew"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
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
          <div className="glass-panel" style={{ maxWidth: "450px", width: "100%", padding: "28px", background: "var(--modal-bg)" }}>
            <h3 style={{ fontSize: "1.4rem", marginBottom: "16px" }}>Create Fitness Group</h3>
            <form onSubmit={handleCreateGroup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Group / Crew Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Iron Spartans Strength Club"
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Description & Focus
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Daily barbell training, progressive overload accountability, and nutrition checks."
                  rows={3}
                  style={{ width: "100%", background: "var(--bg-tertiary)", color: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid var(--card-border)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
