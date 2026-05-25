import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  ZYNEX_API_PORT: z.coerce.number().default(4101),
  DATABASE_URL: z.string().default("postgresql://zynex:zynex@localhost:5432/zynex"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  CLICKHOUSE_URL: z.string().default("http://localhost:8123"),
  NEXTAUTH_SECRET: z.string().default("local-dev-secret"),
  ZYNEX_JWT_SECRET: z.string().default("local-api-jwt-secret"),
  ZYNEX_COOKIE_DOMAIN: z.string().optional(),
  SPACESHIP_SMTP_HOST: z.string().optional(),
  SPACESHIP_SMTP_PORT: z.coerce.number().default(587),
  SPACESHIP_SMTP_USER: z.string().default("support@zyfrr.com"),
  SPACESHIP_SMTP_PASS: z.string().optional(),
  ZYNEX_SUPPORT_EMAIL: z.string().default("support@zyfrr.com"),
  RESEND_API_KEY: z.string().optional(),
  ZYNEX_EMAIL_FROM: z.string().default("ZyNex Support <support@zyfrr.com>"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_PHONE: z.string().optional()
});

export const env = envSchema.parse(process.env);
