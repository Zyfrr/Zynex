import jwt from "jsonwebtoken";
import { env } from "../../config/env";

export type AuthTokenPayload = {
  userId: string;
  sessionId: string;
  email?: string | null;
};

export type SignupVerificationTokenPayload = {
  kind: "SIGNUP_VERIFICATION";
  email?: string | null;
  phoneCountryCode?: string | null;
  phoneNumber?: string | null;
};

export function signAccessToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.ZYNEX_JWT_SECRET, { expiresIn: "30m" });
}

export function signRefreshToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.ZYNEX_JWT_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.ZYNEX_JWT_SECRET) as AuthTokenPayload;
}

export function signSignupVerificationToken(payload: SignupVerificationTokenPayload) {
  return jwt.sign(payload, env.ZYNEX_JWT_SECRET, { expiresIn: "15m" });
}

export function verifySignupVerificationToken(token: string) {
  return jwt.verify(token, env.ZYNEX_JWT_SECRET) as SignupVerificationTokenPayload;
}
