/**
 * FitNation AI — Frontend API Client
 */

const BASE_URL = "/api";

// Configurable auth token (stored in localStorage, sessionStorage, or memory)
const savedToken = localStorage.getItem("fitnation_token") || sessionStorage.getItem("fitnation_token");
let currentToken = savedToken || null;

export function setAuthToken(token, remember = true) {
  currentToken = token;
  if (token) {
    if (remember) {
      localStorage.setItem("fitnation_token", token);
      sessionStorage.removeItem("fitnation_token");
    } else {
      sessionStorage.setItem("fitnation_token", token);
      localStorage.removeItem("fitnation_token");
    }
  } else {
    localStorage.removeItem("fitnation_token");
    sessionStorage.removeItem("fitnation_token");
  }
}

export function getAuthToken() {
  return currentToken || localStorage.getItem("fitnation_token") || sessionStorage.getItem("fitnation_token");
}

export function clearAuthToken() {
  currentToken = null;
  localStorage.removeItem("fitnation_token");
  sessionStorage.removeItem("fitnation_token");
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data?.error?.message || data?.error || `HTTP error ${res.status}`;
      throw new Error(errorMsg);
    }
    return data?.data !== undefined ? data.data : data;
  } catch (err) {
    console.error(`API Error [${options.method || "GET"} ${path}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Authentication
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getAuthMe: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),

  // Users & Profile
  syncUser: (data) => request("/users/sync", { method: "POST", body: JSON.stringify(data) }),
  getProfile: async () => {
    try {
      return await request("/auth/me");
    } catch {
      return await request("/users/me");
    }
  },
  updateProfile: (data) => request("/users/me", { method: "PATCH", body: JSON.stringify(data) }),
  saveAssessment: (data) => request("/users/assessment", { method: "POST", body: JSON.stringify(data) }),

  // Activity
  getTodayActivity: () => request("/activity/today"),
  logActivity: (data) => request("/activity", { method: "POST", body: JSON.stringify(data) }),
  getActivityRange: (from, to) => request(`/activity/range?from=${from}&to=${to}`),
  getActivitySummary: (period = "7d") => request(`/activity/summary?period=${period}`),

  // Workouts
  getExercises: (params = "") => request(`/workouts/exercises${params}`),
  getTodayWorkout: () => request("/workouts/today"),
  createWorkout: (data) => request("/workouts", { method: "POST", body: JSON.stringify(data) }),
  generateWorkout: (data) => request("/workouts/generate", { method: "POST", body: JSON.stringify(data) }),
  toggleExerciseDone: (id, is_done) => request(`/workouts/exercise/${id}`, { method: "PATCH", body: JSON.stringify({ is_done }) }),
  completeWorkoutSession: (data) => request("/workouts/sessions/complete", { method: "POST", body: JSON.stringify(data) }),

  // Form Check
  analyzePose: (exercise, pose_keypoints) => request("/form-check/analyze", { method: "POST", body: JSON.stringify({ exercise, pose_keypoints }) }),
  getFormHistory: () => request("/form-check/history"),

  // AI Coach & Nutrition AI
  chatWithCoach: (message, history = []) => request("/ai/chat", { method: "POST", body: JSON.stringify({ message, history }) }),
  getChatHistory: () => request("/ai/chat/history"),
  parseFoodNatural: (text) => request("/ai/parse-food", { method: "POST", body: JSON.stringify({ text }) }),

  // Nutrition
  getTodayNutrition: () => request("/nutrition/today"),
  logMeal: (data) => request("/nutrition", { method: "POST", body: JSON.stringify(data) }),
  deleteMeal: (id) => request(`/nutrition/${id}`, { method: "DELETE" }),

  // Challenges & Gamification
  getChallenges: () => request("/challenges"),
  joinChallenge: (id) => request(`/challenges/${id}/join`, { method: "POST" }),
  progressChallenge: (id, increment = 1) => request(`/challenges/${id}/progress`, { method: "POST", body: JSON.stringify({ increment }) }),
  getGamificationStatus: () => request("/gamification/status"),
  getAchievements: () => request("/gamification/achievements"),
  claimDailyStreak: () => request("/gamification/claim-streak", { method: "POST" }),

  // Leaderboard
  getLeaderboard: (scope = "global") => request(`/leaderboard?scope=${scope}`),

  // Groups
  getUserGroups: () => request("/groups"),
  getDiscoverGroups: () => request("/groups/discover"),
  createGroup: (data) => request("/groups", { method: "POST", body: JSON.stringify(data) }),
  joinGroup: (id) => request(`/groups/${id}/join`, { method: "POST" }),
  leaveGroup: (id) => request(`/groups/${id}/leave`, { method: "POST" }),
};
