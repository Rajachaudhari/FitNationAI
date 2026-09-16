import { env } from "./env.js";

const SENSITIVE_KEYS = ["password", "token", "authorization", "privatekey", "secret", "api_key"];

function sanitize(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      clean[key] = "[REDACTED]";
    } else if (typeof val === "object") {
      clean[key] = sanitize(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "INFO", message: msg, ...sanitize(meta) }));
  },
  warn: (msg, meta = {}) => {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: "WARN", message: msg, ...sanitize(meta) }));
  },
  error: (msg, meta = {}) => {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: "ERROR", message: msg, ...sanitize(meta) }));
  },
  debug: (msg, meta = {}) => {
    if (env.NODE_ENV !== "production") {
      console.debug(JSON.stringify({ timestamp: new Date().toISOString(), level: "DEBUG", message: msg, ...sanitize(meta) }));
    }
  },
};
