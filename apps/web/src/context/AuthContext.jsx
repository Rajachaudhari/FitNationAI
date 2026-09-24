import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setAuthToken, getAuthToken, clearAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  async function initAuth() {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profile = await api.getAuthMe();
      setUser(profile);
    } catch (err) {
      console.warn("Session expired or invalid token:", err?.message || err);
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(identifier, password, rememberMe = true) {
    const response = await api.login({ identifier, password, rememberMe });
    const { user: authedUser, token } = response;
    setAuthToken(token, rememberMe);
    setUser(authedUser);
    return authedUser;
  }

  async function register(registrationData) {
    const response = await api.register(registrationData);
    const { user: newUser, token } = response;
    if (token) {
      setAuthToken(token, true);
      setUser(newUser);
    }
    return response;
  }

  async function logout() {
    try {
      await api.logout();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      clearAuthToken();
      setUser(null);
    }
  }

  async function refreshUser() {
    try {
      const profile = await api.getAuthMe();
      setUser(profile);
      return profile;
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
