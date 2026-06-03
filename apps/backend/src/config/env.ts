import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("WarehouseOS <noreply@yourwarehouse.com>"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  LOW_STOCK_ALERT_EMAILS: z.string().default(""),
  DAILY_SUMMARY_EMAILS: z.string().default(""),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    result.error.issues.forEach((issue) => {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    });
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
export type Env = typeof env;