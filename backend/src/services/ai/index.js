import { env } from "../../config/env.js";
import { MockAIProvider } from "./MockAIProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";

export const aiService = env.AI_PROVIDER === "openai" ? new OpenAIProvider() : new MockAIProvider();
