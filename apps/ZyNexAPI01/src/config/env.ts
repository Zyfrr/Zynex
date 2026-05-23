import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  ZYNEX_API_PORT: z.coerce.number().default(4101),
  DATABASE_URL: z.string().default("postgresql://zynex:zynex@localhost:5432/zynex"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  CLICKHOUSE_URL: z.string().default("http://localhost:8123"),
  NEXTAUTH_SECRET: z.string().default("local-dev-secret")
});

export const env = envSchema.parse(process.env);
