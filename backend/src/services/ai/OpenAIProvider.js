import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AIProvider } from "./AIProvider.js";
import { MockAIProvider } from "./MockAIProvider.js";

export class OpenAIProvider extends AIProvider {
  constructor() {
    super();
    this.fallback = new MockAIProvider();
    this.apiKey = env.OPENAI_API_KEY;
    this.model = env.AI_MODEL || "gpt-4o-mini";
  }

  async chat(messages, userContext = {}) {
    if (!this.apiKey || this.apiKey.startsWith("sk-...")) {
      return this.fallback.chat(messages, userContext);
    }

    try {
      const systemPrompt =
        "You are the elite AI Fitness Coach inside FitNation AI. " +
        `User context: Name: ${userContext.name || "Athlete"}, Goal: ${userContext.goal || "General Fitness"}, ` +
        `Fitness Level: ${userContext.fitness_level || "Intermediate"}, Streak: ${userContext.streak_days || 0} days. ` +
        "Guidelines: Be encouraging, concise, evidence-based, and practical. " +
        "Never give clinical or medical diagnosis. For acute pain or injury, refer to a healthcare professional.";

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: this.model,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: 0.7,
          max_tokens: 600,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.data.choices[0].message.content;
    } catch (err) {
      logger.warn("OpenAI chat completion failed, falling back to mock provider", { error: err.message });
      return this.fallback.chat(messages, userContext);
    }
  }

  async generateWorkout(profile = {}, preferences = {}) {
    if (!this.apiKey || this.apiKey.startsWith("sk-...")) {
      return this.fallback.generateWorkout(profile, preferences);
    }

    try {
      const prompt =
        `Generate a structured JSON workout plan for a ${preferences.difficulty || profile.fitness_level || "Intermediate"} user ` +
        `with goal: "${preferences.goal || profile.goal || "Hypertrophy"}", target duration: ${preferences.duration_min || 45} mins, ` +
        `and focus: "${preferences.focus || "Full Body"}". Return pure JSON adhering to the required schema with exercises, sets, reps, and rest.`;

      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are an expert strength & conditioning coach. Output strict JSON with keys: title, duration_minutes, difficulty, focus, warmup, exercises (array of name, sets, reps, rest_seconds, target_muscles, instructions), cooldown.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 12000,
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      logger.warn("OpenAI workout generation failed, falling back to mock provider", { error: err.message });
      return this.fallback.generateWorkout(profile, preferences);
    }
  }

  async parseFood(naturalText) {
    if (!this.apiKey || this.apiKey.startsWith("sk-...")) {
      return this.fallback.parseFood(naturalText);
    }

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a clinical nutrition estimator. Given a natural language meal description, estimate description, estimated_calories, protein_g, carbs_g, fat_g, confidence (0 to 1), items (array of string), disclaimer. Return strict JSON.",
            },
            { role: "user", content: naturalText },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      logger.warn("OpenAI food parse failed, falling back to mock provider", { error: err.message });
      return this.fallback.parseFood(naturalText);
    }
  }
}
