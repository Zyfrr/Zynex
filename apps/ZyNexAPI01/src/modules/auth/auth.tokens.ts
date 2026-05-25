import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export type AuthTokenPayload = {
  userId: string;
  sessionId: string;
  email?: string | null;
};

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.ZYNEX_JWT_SECRET, { expiresIn: "30m" });
}

export function signRefreshToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.ZYNEX_JWT_SECRET, { expiresIn: "30d" });
}
