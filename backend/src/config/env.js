import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().default("postgres://postgres:postgres@localhost:5432/fitnation_ai"),
  PGSSL: z.coerce.boolean().default(false),
  FIREBASE_PROJECT_ID: z.string().optional().default("fitnation-dev"),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default("admin@fitnation-dev.iam.gserviceaccount.com"),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),
  FIREBASE_STORAGE_BUCKET: z.string().optional().default(""),
  AI_PROVIDER: z.enum(["openai", "mock"]).default("mock"),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_API_KEY: z.string().optional().default(""),
  SENTRY_DSN: z.string().optional().default(""),
  GOOGLE_MAPS_API_KEY: z.string().optional().default(""),
  DEV_AUTH_BYPASS: z.coerce.boolean().default(true), // enables development & automated test authorization without live Firebase token
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
