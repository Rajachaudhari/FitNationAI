import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles, ShieldAlert } from "lucide-react";
import { api } from "../services/api";

export function AICoachChat({ user }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        `Hello ${user?.name || "Athlete"}! I am your FitNation AI Coach. ` +
        "I'm here to analyze your exercise form, optimize your progressive overload, tailor your nutrition macros, and keep your consistency locked in. What are we targeting today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChatHistory() {
    try {
      const history = await api.getChatHistory();
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleSend(textToSend) {
    const text = textToSend || input;
    if (!text.trim() || sending) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await api.chatWithCoach(text, messages);
      const assistantMsg = { role: "assistant", content: res.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Apologies, I encountered a temporary connection glitch. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  const promptSuggestions = [
    "How to eliminate knee cave (valgus) in deep squats?",
    "Calculate my optimal daily protein and calorie target",
    "Should I do cardio before or after lifting?",
    "Quick 10-minute dynamic warmup for upper body",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", gap: "16px" }}>
      {/* Header Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.85rem", marginBottom: "4px" }}>AI Fitness Coach</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem" }}>
            Personalized training science, bioenergetics, and biomechanical guidance.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 171, 0, 0.1)",
            border: "1px solid rgba(255, 171, 0, 0.3)",
            padding: "8px 14px",
            borderRadius: "var(--radius-full)",
            color: "var(--accent-amber)",
            fontSize: "0.78rem",
            fontWeight: 600,
          }}
        >
          <ShieldAlert size={14} />
          <span>Non-clinical: For medical conditions or acute pain, consult a physician.</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        className="glass-panel"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
        }}
      >
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "12px",
                alignSelf: isUser ? "flex-end" : "flex-start",
                maxWidth: "80%",
              }}
            >
              {!isUser && (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot size={20} color="#05070e" />
                </div>
              )}

              <div
                style={{
                  background: isUser ? "linear-gradient(135deg, #00f0ff 0%, #00b4d8 100%)" : "var(--bg-tertiary)",
                  color: isUser ? "#05070e" : "var(--text-primary)",
                  padding: "14px 18px",
                  borderRadius: "18px",
                  borderBottomRightRadius: isUser ? "4px" : "18px",
                  borderBottomLeftRadius: isUser ? "18px" : "4px",
                  border: isUser ? "none" : "1px solid var(--card-border)",
                  fontSize: "0.94rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                  boxShadow: isUser ? "0 4px 15px rgba(0,240,255,0.25)" : "none",
                }}
              >
                {m.content}
              </div>

              {isUser && (
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <User size={18} color="#fff" />
                </div>
              )}
            </div>
          );
        })}

        {sending && (
          <div style={{ display: "flex", gap: "12px", alignSelf: "flex-start" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #00f0ff, #7000ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={20} color="#05070e" />
            </div>
            <div style={{ background: "var(--bg-tertiary)", padding: "14px 18px", borderRadius: "18px", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Coach is formulating response...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="btn-secondary"
            style={{ padding: "6px 14px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
          >
            <Sparkles size={13} color="var(--accent-cyan)" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ display: "flex", gap: "10px" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your coach anything about programming, form, nutrition, or recovery..."
          style={{
            flex: 1,
            background: "var(--bg-secondary)",
            border: "1px solid var(--card-border)",
            borderRadius: "var(--radius-full)",
            padding: "14px 22px",
            color: "#fff",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="btn-primary"
          style={{ padding: "0 24px" }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
