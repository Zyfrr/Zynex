import type { Response } from "express";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { configService } from "../config/config.service";
import { emailService } from "./email.service";
import { generateNumericCode, hashOtp, verifyOtp } from "./auth.otp";
import { hashSecret, verifySecret } from "./auth.password";
import { signAccessToken, signRefreshToken } from "./auth.tokens";
import { smsService } from "./sms.service";
import { AppError } from "../../errors/AppError";
import { ErrorCode } from "../../errors/ErrorCodes";

const ACCESS_COOKIE = "ZyNexAccessToken";
const REFRESH_COOKIE = "ZyNexRefreshToken";

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    domain: env.ZYNEX_COOKIE_DOMAIN || undefined,
    path: "/"
  };

  res.cookie(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 30 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export class AuthService {
  async startEmailCode(email: string, purpose: "LOGIN" | "SIGNUP" | "PASSWORD_RESET") {
    const digits = await configService.getNumber("AuthOtpDigits");
    const expiresMinutes = await configService.getNumber("AuthOtpExpiresMinutes");
    const maxAttempts = await configService.getNumber("AuthOtpMaxAttempts");
    const cooldownSeconds = await configService.getNumber("AuthOtpResendCooldownSeconds");
    const code = generateNumericCode(digits);

    await prisma.verificationCode.updateMany({
      where: { identifier: email, purpose, status: "PENDING" },
      data: { status: "EXPIRED" }
    });
    await prisma.verificationCode.create({
      data: {
        identifier: email,
        codeHash: await hashOtp(code),
        purpose,
        maxAttempts,
        expiresAt: addMinutes(new Date(), expiresMinutes)
      }
    });

    const delivery = await emailService.sendVerificationCode(email, code);
    return { identifier: email, purpose, digits, expiresInMinutes: expiresMinutes, resendCooldownSeconds: cooldownSeconds, delivery };
  }

  async verifyEmailCode(email: string, code: string, res: Response) {
    const verification = await prisma.verificationCode.findFirst({
      where: { identifier: email, status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid or expired verification code", 401);
    }

    if (verification.attempts >= verification.maxAttempts) {
      await prisma.verificationCode.update({ where: { id: verification.id }, data: { status: "BLOCKED" } });
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Verification attempt limit exceeded", 429);
    }

    const valid = await verifyOtp(verification.codeHash, code);
    if (!valid) {
      await prisma.verificationCode.update({ where: { id: verification.id }, data: { attempts: { increment: 1 } } });
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid verification code", 401);
    }

    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { status: "CONSUMED", consumedAt: new Date() }
    });

    const user = await prisma.user.upsert({
      where: { email },
      update: { statusCode: "01", lastLoginAt: new Date() },
      create: { email, statusCode: "01", role: "MEMBER" }
    });

    return this.createSession(user.id, email, res);
  }

  async startPhoneCode(countryCode: string, phoneNumber: string) {
    const digits = await configService.getNumber("AuthOtpDigits");
    const expiresMinutes = await configService.getNumber("AuthOtpExpiresMinutes");
    const maxAttempts = await configService.getNumber("AuthOtpMaxAttempts");
    const code = generateNumericCode(digits);
    const identifier = `${countryCode}${phoneNumber}`;

    await prisma.verificationCode.updateMany({
      where: { identifier, purpose: "PHONE_LOGIN", status: "PENDING" },
      data: { status: "EXPIRED" }
    });
    await prisma.verificationCode.create({
      data: {
        identifier,
        codeHash: await hashOtp(code),
        purpose: "PHONE_LOGIN",
        maxAttempts,
        expiresAt: addMinutes(new Date(), expiresMinutes)
      }
    });

    const delivery = await smsService.sendVerificationCode(identifier, code);
    return { identifier, digits, expiresInMinutes: expiresMinutes, delivery };
  }

  async verifyPhoneCode(countryCode: string, phoneNumber: string, code: string, res: Response) {
    const identifier = `${countryCode}${phoneNumber}`;
    const verification = await prisma.verificationCode.findFirst({
      where: { identifier, purpose: "PHONE_LOGIN", status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid or expired verification code", 401);
    }

    const valid = await verifyOtp(verification.codeHash, code);
    if (!valid) {
      await prisma.verificationCode.update({ where: { id: verification.id }, data: { attempts: { increment: 1 } } });
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid verification code", 401);
    }

    await prisma.verificationCode.update({
      where: { id: verification.id },
      data: { status: "CONSUMED", consumedAt: new Date() }
    });

    const user = await prisma.user.upsert({
      where: { phoneNumber },
      update: { phoneCountryCode: countryCode, statusCode: "01", lastLoginAt: new Date() },
      create: { phoneCountryCode: countryCode, phoneNumber, statusCode: "01", role: "MEMBER" }
    });

    return this.createSession(user.id, user.email, res);
  }

  async registerManual(input: {
    email: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    password: string;
    termsAccepted: true;
  }, res: Response) {
    const passwordHash = await hashSecret(input.password);
    const user = await prisma.user.upsert({
      where: { email: input.email },
      update: { passwordHash, name: `${input.firstName} ${input.lastName}`, statusCode: "01" },
      create: {
        email: input.email,
        passwordHash,
        name: `${input.firstName} ${input.lastName}`,
        statusCode: "01",
        role: "MEMBER"
      }
    });

    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null
      },
      create: {
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null
      }
    });

    await prisma.termsAcceptance.create({
      data: { userId: user.id, termsVersion: "2026-05", privacyVersion: "2026-05" }
    });

    return this.createSession(user.id, input.email, res);
  }

  async loginPassword(email: string, password: string, res: Response) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials", 401);
    const valid = await verifySecret(user.passwordHash, password);
    if (!valid) throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials", 401);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), statusCode: "01" } });
    return this.createSession(user.id, email, res);
  }

  async createSession(userId: string, email: string | null, res: Response) {
    const session = await prisma.session.create({
      data: {
        userId,
        tokenHash: await hashSecret(`${userId}:${Date.now()}:access`),
        refreshTokenHash: await hashSecret(`${userId}:${Date.now()}:refresh`),
        statusCode: "01",
        expiresAt: addMinutes(new Date(), 60 * 24 * 30)
      }
    });
    const payload = { userId, sessionId: session.id, email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setAuthCookies(res, accessToken, refreshToken);
    return { userId, email, sessionId: session.id, accessToken, refreshToken };
  }

  clearSessionCookies(res: Response) {
    res.clearCookie(ACCESS_COOKIE, { path: "/" });
    res.clearCookie(REFRESH_COOKIE, { path: "/" });
  }

  async getCurrentUser(userId?: string) {
    if (!userId) return null;
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });
  }
}

export const authService = new AuthService();
