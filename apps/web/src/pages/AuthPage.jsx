import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Dumbbell,
  ScanEye,
  BotMessageSquare,
  Trophy,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();

  // Determine active tab from route: /signup -> "signup", otherwise "signin"
  const isSignUpRoute = location.pathname === "/signup";
  const [activeTab, setActiveTab] = useState(isSignUpRoute ? "signup" : "signin");

  useEffect(() => {
    setActiveTab(isSignUpRoute ? "signup" : "signin");
  }, [location.pathname]);

  // If already authenticated, redirect to /dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Theme toggle
  const [theme, setTheme] = useState(() => localStorage.getItem("fitnation_theme") || "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fitnation_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInRemember, setSignInRemember] = useState(true);
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState("");
  const [signUpMobile, setSignUpMobile] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpAge, setSignUpAge] = useState("");
  const [signUpGender, setSignUpGender] = useState("male");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [signUpTerms, setSignUpTerms] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});
    navigate(tab === "signup" ? "/signup" : "/signin");
  };

  // Indian mobile number validation (10 digits starting with 6, 7, 8, or 9)
  const validateIndianMobile = (phone) => {
    const clean = phone.replace(/\D/g, "");
    return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
  };

  // Email format validation
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle Sign In Submit
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const errors = {};

    if (!signInIdentifier.trim()) {
      errors.identifier = "Email or mobile number is required";
    }
    if (!signInPassword) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await login(signInIdentifier.trim(), signInPassword, signInRemember);
      setSuccessMessage("Sign in successful! Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    const errors = {};

    if (!signUpName.trim() || signUpName.trim().length < 2) {
      errors.name = "Full name must be at least 2 characters";
    }

    const cleanMobile = signUpMobile.replace(/\D/g, "");
    if (!cleanMobile) {
      errors.mobile = "10-digit mobile number is required";
    } else if (!validateIndianMobile(cleanMobile)) {
      errors.mobile = "Please enter a valid 10-digit Indian mobile number (e.g., 9876543210)";
    }

    if (!signUpEmail.trim()) {
      errors.email = "Email address is required";
    } else if (!validateEmail(signUpEmail.trim())) {
      errors.email = "Please enter a valid email address";
    }

    const ageNum = parseInt(signUpAge, 10);
    if (!signUpAge) {
      errors.age = "Age is required";
    } else if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      errors.age = "Please enter a reasonable age (10 to 120)";
    }

    if (!signUpGender) {
      errors.gender = "Please select your gender";
    }

    if (!signUpPassword) {
      errors.password = "Password is required";
    } else if (signUpPassword.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!signUpConfirmPassword) {
      errors.confirmPassword = "Confirm password is required";
    } else if (signUpPassword !== signUpConfirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!signUpTerms) {
      errors.terms = "You must agree to the Terms and Conditions to create an account";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await register({
        name: signUpName.trim(),
        phone: cleanMobile,
        email: signUpEmail.trim().toLowerCase(),
        age: ageNum,
        gender: signUpGender,
        password: signUpPassword,
        confirmPassword: signUpConfirmPassword,
        terms: signUpTerms,
      });

      setSuccessMessage("Account created successfully! Redirecting to dashboard...");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 700);
    } catch (err) {
      setErrorMessage(err.message || "Registration failed. Please review your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Demo Credentials Autofill
  const handleQuickDemoFill = (type) => {
    if (type === "vishal") {
      setSignInIdentifier("vishal@fitnation.ai");
      setSignInPassword("FitNation@123");
    } else {
      setSignInIdentifier("9876543210");
      setSignInPassword("FitNation@123");
    }
    setFieldErrors({});
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-dark)",
        color: "var(--text-primary)",
        position: "relative",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 32px",
          borderBottom: "1px solid var(--card-border)",
          background: "var(--bg-primary)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(0, 240, 255, 0.4)",
            }}
          >
            <Zap size={20} color="#05070e" strokeWidth={3} />
          </div>
          <div>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Fit<span style={{ color: "var(--accent-cyan)" }}>Nation</span>
            </span>
            <span
              style={{
                marginLeft: "6px",
                fontSize: "0.65rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(0,240,255,0.15)",
                color: "var(--accent-cyan)",
                fontWeight: 700,
              }}
            >
              AI
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="glass-panel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "var(--radius-full)",
              cursor: "pointer",
              border: "1px solid var(--card-border)",
              background: theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? (
              <>
                <Sun size={15} color="var(--accent-amber)" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={15} color="var(--accent-cyan)" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area: Split View for Desktop, Responsive Stack for Mobile */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
          maxWidth: "1280px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "40px",
            width: "100%",
            alignItems: "center",
          }}
        >
          {/* Left Hero Showcase Section */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", width: "fit-content" }}>
              <span className="badge badge-purple" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                <Sparkles size={14} /> AI-Powered Biomechanics Platform
              </span>
            </div>

            <h1
              style={{
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Train Smarter with{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--accent-cyan) 0%, #7000ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Real-Time AI Vision
              </span>{" "}
              & Personalized Coaching.
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6 }}>
              Join thousands of athletes leveraging computer vision posture correction, adaptive workout splits,
              intelligent nutrition tracking, and gamified challenges.
            </p>

            {/* Feature Highlights Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "12px" }}>
              <div
                className="glass-panel"
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  background: "var(--bg-secondary)",
                }}
              >
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    background: "rgba(0, 240, 255, 0.12)",
                    color: "var(--accent-cyan)",
                  }}
                >
                  <ScanEye size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>AI Form Check</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Millisecond joint tracking to correct squat & pushup posture.
                  </p>
                </div>
              </div>

              <div
                className="glass-panel"
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  background: "var(--bg-secondary)",
                }}
              >
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    background: "rgba(139, 92, 246, 0.12)",
                    color: "var(--accent-purple)",
                  }}
                >
                  <BotMessageSquare size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Conversational Coach</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Expert progressive overload advice with safety guardrails.
                  </p>
                </div>
              </div>

              <div
                className="glass-panel"
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  background: "var(--bg-secondary)",
                }}
              >
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    background: "rgba(255, 171, 0, 0.12)",
                    color: "var(--accent-amber)",
                  }}
                >
                  <Trophy size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>XP & Streaks</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Earn daily streak rewards, level up and climb the leaderboard.
                  </p>
                </div>
              </div>

              <div
                className="glass-panel"
                style={{
                  padding: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  background: "var(--bg-secondary)",
                }}
              >
                <div
                  style={{
                    padding: "8px",
                    borderRadius: "10px",
                    background: "rgba(0, 230, 118, 0.12)",
                    color: "var(--accent-emerald)",
                  }}
                >
                  <Dumbbell size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Adaptive Workout Split</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Dynamically regenerated according to recovery and logged fatigue.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof / Security Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginTop: "16px",
                padding: "14px 18px",
                borderRadius: "var(--radius-md)",
                background: "rgba(0, 240, 255, 0.05)",
                border: "1px solid rgba(0, 240, 255, 0.15)",
              }}
            >
              <ShieldCheck size={26} color="var(--accent-cyan)" />
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)" }}>Bank-Grade Security:</strong> Secure JWT session
                tokens, encrypted credentials, and full data privacy.
              </div>
            </div>
          </div>

          {/* Right Card: Authentication Form with Tabs */}
          <div
            className="glass-panel"
            style={{
              padding: "clamp(24px, 5vw, 40px)",
              background: "var(--card-bg)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
              border: "1px solid var(--card-border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            {/* Tab Switcher */}
            <div
              style={{
                display: "flex",
                background: "var(--bg-tertiary)",
                padding: "5px",
                borderRadius: "var(--radius-full)",
                marginBottom: "28px",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => switchTab("signin")}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: activeTab === "signin" ? "var(--bg-primary)" : "transparent",
                  color: activeTab === "signin" ? "var(--accent-cyan)" : "var(--text-secondary)",
                  fontWeight: activeTab === "signin" ? 700 : 500,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: activeTab === "signin" ? "0 2px 10px rgba(0,0,0,0.1)" : "none",
                  transition: "all var(--transition-fast)",
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchTab("signup")}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  background: activeTab === "signup" ? "var(--bg-primary)" : "transparent",
                  color: activeTab === "signup" ? "var(--accent-cyan)" : "var(--text-secondary)",
                  fontWeight: activeTab === "signup" ? 700 : 500,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: activeTab === "signup" ? "0 2px 10px rgba(0,0,0,0.1)" : "none",
                  transition: "all var(--transition-fast)",
                }}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages Banner */}
            {errorMessage && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 51, 102, 0.1)",
                  border: "1px solid rgba(255, 51, 102, 0.3)",
                  color: "var(--accent-rose)",
                  fontSize: "0.88rem",
                  marginBottom: "20px",
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>{errorMessage}</div>
              </div>
            )}

            {successMessage && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(0, 230, 118, 0.1)",
                  border: "1px solid rgba(0, 230, 118, 0.3)",
                  color: "var(--accent-emerald)",
                  fontSize: "0.88rem",
                  marginBottom: "20px",
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <div>{successMessage}</div>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {activeTab === "signin" && (
              <form onSubmit={handleSignInSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <h3 style={{ fontSize: "1.45rem", marginBottom: "4px" }}>Welcome Back, Athlete</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                    Sign in with your email or 10-digit mobile number.
                  </p>
                </div>

                {/* Email or Mobile Field */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    Email or Mobile Number <span style={{ color: "var(--accent-rose)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Mail size={18} />
                    </div>
                    <input
                      type="text"
                      value={signInIdentifier}
                      onChange={(e) => {
                        setSignInIdentifier(e.target.value);
                        if (fieldErrors.identifier) {
                          setFieldErrors((prev) => ({ ...prev, identifier: null }));
                        }
                      }}
                      placeholder="athlete@fitnation.ai or 9876543210"
                      disabled={submitting}
                      style={{
                        width: "100%",
                        padding: "12px 14px 12px 42px",
                        borderRadius: "var(--radius-md)",
                        border: fieldErrors.identifier
                          ? "1px solid var(--accent-rose)"
                          : "1px solid var(--card-border)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        fontSize: "0.92rem",
                        outline: "none",
                        transition: "all var(--transition-fast)",
                      }}
                    />
                  </div>
                  {fieldErrors.identifier && (
                    <span style={{ color: "var(--accent-rose)", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                      {fieldErrors.identifier}
                    </span>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Password <span style={{ color: "var(--accent-rose)" }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-cyan)",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Lock size={18} />
                    </div>
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      value={signInPassword}
                      onChange={(e) => {
                        setSignInPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: null }));
                        }
                      }}
                      placeholder="Enter your password"
                      disabled={submitting}
                      style={{
                        width: "100%",
                        padding: "12px 42px 12px 42px",
                        borderRadius: "var(--radius-md)",
                        border: fieldErrors.password
                          ? "1px solid var(--accent-rose)"
                          : "1px solid var(--card-border)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        fontSize: "0.92rem",
                        outline: "none",
                        transition: "all var(--transition-fast)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span style={{ color: "var(--accent-rose)", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={signInRemember}
                    onChange={(e) => setSignInRemember(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "var(--accent-cyan)",
                      cursor: "pointer",
                    }}
                  />
                  <label
                    htmlFor="rememberMe"
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    Remember me for 30 days
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "13px",
                    marginTop: "6px",
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                      <span>Authenticating Athlete...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {/* Quick Demo Credentials Autofill */}
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px dashed var(--card-border)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    DEMO QUICK-LOGIN:
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoFill("vishal")}
                      className="btn-secondary"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      ⚡ Demo: Vishal Fit (Email)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoFill("mobile")}
                      className="btn-secondary"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      📱 Demo: Mobile (9876543210)
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* TAB 2: SIGN UP */}
            {activeTab === "signup" && (
              <form onSubmit={handleSignUpSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.45rem", marginBottom: "4px" }}>Begin Your Fitness Journey</h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                    Create your athlete profile to get personalized AI workout & nutrition tracking.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Full Name <span style={{ color: "var(--accent-rose)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={signUpName}
                      onChange={(e) => {
                        setSignUpName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                      }}
                      placeholder="e.g. Rohit Sharma"
                      disabled={submitting}
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 42px",
                        borderRadius: "var(--radius-md)",
                        border: fieldErrors.name ? "1px solid var(--accent-rose)" : "1px solid var(--card-border)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    />
                  </div>
                  {fieldErrors.name && (
                    <span style={{ color: "var(--accent-rose)", fontSize: "0.76rem", marginTop: "3px", display: "block" }}>
                      {fieldErrors.name}
                    </span>
                  )}
                </div>

                {/* Mobile Number & Email (2 columns on wide, stacked on mobile) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  {/* Mobile Number */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Mobile Number (+91) <span style={{ color: "var(--accent-rose)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "0.88rem", fontWeight: 700 }}>
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={signUpMobile}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setSignUpMobile(val);
                          if (fieldErrors.mobile) setFieldErrors((prev) => ({ ...prev, mobile: null }));
                        }}
                        placeholder="9876543210"
                        disabled={submitting}
                        style={{
                          width: "100%",
                          padding: "11px 14px 11px 48px",
                          borderRadius: "var(--radius-md)",
                          border: fieldErrors.mobile ? "1px solid var(--accent-rose)" : "1px solid var(--card-border)",
                          background: "var(--bg-tertiary)",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          outline: "none",
                        }}
                      />
                    </div>
                    {fieldErrors.mobile && (
                      <span style={{ color: "var(--accent-rose)", fontSize: "0.76rem", marginTop: "3px", display: "block" }}>
                        {fieldErrors.mobile}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Email Address <span style={{ color: "var(--accent-rose)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                        <Mail size={18} />
                      </div>
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => {
                          setSignUpEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                        }}
                        placeholder="athlete@fitnation.ai"
                        disabled={submitting}
                        style={{
                          width: "100%",
                          padding: "11px 14px 11px 42px",
                          borderRadius: "var(--radius-md)",
                          border: fieldErrors.email ? "1px solid var(--accent-rose)" : "1px solid var(--card-border)",
                          background: "var(--bg-tertiary)",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          outline: "none",
                        }}
                      />
                    </div>
                    {fieldErrors.email && (
                      <span style={{ color: "var(--accent-rose)", fontSize: "0.76rem", marginTop: "3px", display: "block" }}>
                        {fieldErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Age & Gender Row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "12px" }}>
                  {/* Age */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Age <span style={{ color: "var(--accent-rose)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                        <Calendar size={18} />
                      </div>
                      <input
                        type="number"
                        min="10"
                        max="120"
                        value={signUpAge}
                        onChange={(e) => {
                          setSignUpAge(e.target.value);
                          if (fieldErrors.age) setFieldErrors((prev) => ({ ...prev, age: null }));
                        }}
                        placeholder="24"
                        disabled={submitting}
                        style={{
                          width: "100%",
                          padding: "11px 14px 11px 42px",
                          borderRadius: "var(--radius-md)",
                          border: fieldErrors.age ? "1px solid var(--accent-rose)" : "1px solid var(--card-border)",
                          background: "var(--bg-tertiary)",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          outline: "none",
                        }}
                      />
                    </div>
                    {fieldErrors.age && (
                      <span style={{ color: "var(--accent-rose)", fontSize: "0.76rem", marginTop: "3px", display: "block" }}>
                        {fieldErrors.age}
                      </span>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Gender <span style={{ color: "var(--accent-rose)" }}>*</span>
                    </label>
                    <select
                      value={signUpGender}
                      onChange={(e) => setSignUpGender(e.target.value)}
                      disabled={submitting}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--card-border)",
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                {/* Password & Confirm Password Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                  {/* Password */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Password <span style={{ color: "var(--accent-rose)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                        <Lock size={17} />
                      </div>
                      <input
                        type={showSignUpPassword ? "text" : "password"}
                        value={signUpPassword}
                        onChange={(e) => {
                          setSignUpPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                        }}
                        placeholder="Min 6 characters"
                        disabled={submitting}
                        style={{
                          width: "100%",
                          padding: "11px 40px 11px 40px",
                          borderRadius: "var(--radius-md)",
                          border: fieldErrors.password ? "1px solid var(--accent-rose)" : "1px solid var(--card-border)",
                          background: "var(--bg-tertiary)",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showSignUpPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <span style={{ color: "var(--accent-rose)", fontSize: "0.76rem", marginTop: "3px", display: "block" }}>
                        {fieldErrors.password}
                      </span>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Confirm Password <span style={{ color: "var(--accent-rose)" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
                        <Lock size={17} />
                      </div>
                      <input
                        type={showSignUpConfirmPassword ? "text" : "password"}
                        value={signUpConfirmPassword}
                        onChange={(e) => {
                          setSignUpConfirmPassword(e.target.value);
                          if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                        }}
                        placeholder="Re-enter password"
                        disabled={submitting}
                        style={{
                          width: "100%",
                          padding: "11px 40px 11px 40px",
                          borderRadius: "var(--radius-md)",
                          border: fieldErrors.confirmPassword ? "1px solid var(--accent-rose)" : "1px solid var(--card-border)",
                          background: "var(--bg-tertiary)",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {showSignUpConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {fieldErrors.confirmPassword && (
                      <span style={{ color: "var(--accent-rose)", fontSize: "0.76rem", marginTop: "3px", display: "block" }}>
                        {fieldErrors.confirmPassword}
                      </span>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions Checkbox */}
                <div style={{ marginTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="termsCheckbox"
                      checked={signUpTerms}
                      onChange={(e) => {
                        setSignUpTerms(e.target.checked);
                        if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: null }));
                      }}
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "var(--accent-cyan)",
                        marginTop: "3px",
                        cursor: "pointer",
                      }}
                    />
                    <label
                      htmlFor="termsCheckbox"
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.4,
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      I agree to the FitNation AI <strong style={{ color: "var(--accent-cyan)" }}>Terms of Service</strong>{" "}
                      and <strong style={{ color: "var(--accent-cyan)" }}>Privacy Policy</strong>, including workout safety disclaimers.
                    </label>
                  </div>
                  {fieldErrors.terms && (
                    <span style={{ color: "var(--accent-rose)", fontSize: "0.76rem", marginTop: "3px", display: "block" }}>
                      {fieldErrors.terms}
                    </span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "13px",
                    marginTop: "8px",
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
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
              maxWidth: "440px",
              width: "100%",
              padding: "32px",
              background: "var(--modal-bg)",
            }}
          >
            <h3 style={{ fontSize: "1.35rem", marginBottom: "8px" }}>Reset Your Password</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "20px" }}>
              Enter your registered email address or 10-digit mobile number to receive a secure recovery code.
            </p>

            {forgotSent ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(0, 230, 118, 0.12)",
                    color: "var(--accent-emerald)",
                    fontSize: "0.9rem",
                    marginBottom: "20px",
                  }}
                >
                  <CheckCircle2 size={20} />
                  <span>Password recovery instructions sent to {forgotInput}!</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                    setForgotInput("");
                  }}
                  className="btn-primary"
                  style={{ width: "100%" }}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotInput.trim()) {
                    setForgotSent(true);
                  }
                }}
              >
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Email or Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="e.g. athlete@fitnation.ai"
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--card-border)",
                      background: "var(--bg-tertiary)",
                      color: "var(--text-primary)",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--card-border)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          background: "var(--bg-primary)",
        }}
      >
        <div>© 2026 FitNation AI. Next-generation computer vision fitness platform.</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Security & HIPAA</span>
        </div>
      </footer>
    </div>
  );
}
export default AuthPage;
