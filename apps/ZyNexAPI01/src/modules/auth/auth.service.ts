import type { Response } from "express";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { configService } from "../config/config.service";
import { emailService } from "./email.service";
import { generateNumericCode, hashOtp, verifyOtp } from "./auth.otp";
import { hashSecret, verifySecret } from "./auth.password";
import { signAccessToken, signRefreshToken } from "./auth.tokens";
import { signSignupVerificationToken, verifySignupVerificationToken } from "./auth.tokens";
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

function getDeliveryErrorDetails(error: unknown) {
  const candidate = error as { code?: unknown; status?: unknown; moreInfo?: unknown };
  return {
    reason: error instanceof Error ? error.message : "Unknown delivery failure",
    code: candidate?.code,
    status: candidate?.status,
    moreInfo: candidate?.moreInfo
  };
}

export class AuthService {
  async lookupIdentifier(identifier: string, countryCode = "+91") {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier);
    const digits = normalizedIdentifier.replace(/\D/g, "");
    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: normalizedIdentifier }, include: { profile: true } })
      : await prisma.user.findUnique({ where: { phoneNumber: digits }, include: { profile: true } });

    return {
      identifierType: isEmail ? "EMAIL" : "PHONE",
      identifier: isEmail ? normalizedIdentifier : `${countryCode}${digits}`,
      email: isEmail ? normalizedIdentifier : undefined,
      countryCode: isEmail ? undefined : countryCode,
      phoneNumber: isEmail ? undefined : digits,
      accountExists: Boolean(user),
      profileComplete: Boolean(user?.profile),
      recommendedPurpose: user ? "LOGIN" : "SIGNUP"
    };
  }

  async startEmailCode(email: string, purpose: "LOGIN" | "SIGNUP" | "PASSWORD_RESET") {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (purpose === "SIGNUP" && existingUser) {
      throw new AppError(ErrorCode.EMAIL_ALREADY_EXISTS, "This email is already registered. Please login.", 409);
    }
    if (purpose === "LOGIN" && !existingUser) {
      throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, "This email is not registered with us. Kindly sign up.", 404);
    }

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

    let delivery;
    try {
      delivery = await emailService.sendVerificationCode(email, code);
    } catch (error) {
      throw new AppError(ErrorCode.DELIVERY_FAILED, "Unable to send email verification code. Please check email provider settings.", 502, {
        provider: env.RESEND_API_KEY ? "RESEND" : "SPACESHIP_SMTP",
        ...getDeliveryErrorDetails(error)
      });
    }
    return { identifier: email, purpose, digits, expiresInMinutes: expiresMinutes, resendCooldownSeconds: cooldownSeconds, delivery };
  }

  async verifyEmailCode(
    email: string,
    code: string,
    purpose: "LOGIN" | "SIGNUP",
    res: Response,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
    const verification = await prisma.verificationCode.findFirst({
      where: { identifier: email, purpose, status: "PENDING" },
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

    if (purpose === "SIGNUP") {
      return {
        signupVerificationToken: signSignupVerificationToken({
          kind: "SIGNUP_VERIFICATION",
          email
        }),
        verifiedEmail: email
      };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, "This email is not registered with us. Kindly sign up.", 404);
    }
    await prisma.user.update({ where: { id: user.id }, data: { statusCode: "01", lastLoginAt: new Date() } });

    const session = await this.createSession(user.id, email, res);
    emailService.sendLoginNotice(email, { name: user.name, ...context }).catch((error) => {
      console.warn("[ZyNex Email] Login notice failed", error);
    });
    return { user: { id: session.userId, email: session.email }, accessToken: session.accessToken };
  }

  async startPhoneCode(countryCode: string, phoneNumber: string, purpose: "LOGIN" | "SIGNUP") {
    const existingUser = await prisma.user.findUnique({ where: { phoneNumber } });
    if (purpose === "SIGNUP" && existingUser) {
      throw new AppError(ErrorCode.EMAIL_ALREADY_EXISTS, "This phone number is already registered. Please login.", 409);
    }
    if (purpose === "LOGIN" && !existingUser) {
      throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, "This phone number is not registered with us. Kindly sign up.", 404);
    }

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

    let delivery;
    try {
      delivery = await smsService.sendVerificationCode(identifier, code);
    } catch (error) {
      throw new AppError(ErrorCode.DELIVERY_FAILED, "Unable to send phone verification code. Please check SMS provider settings.", 502, {
        provider: "TWILIO",
        ...getDeliveryErrorDetails(error)
      });
    }
    return { identifier, digits, expiresInMinutes: expiresMinutes, delivery };
  }

  async verifyPhoneCode(
    countryCode: string,
    phoneNumber: string,
    code: string,
    purpose: "LOGIN" | "SIGNUP",
    res: Response,
    context?: { ipAddress?: string; userAgent?: string }
  ) {
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

    if (purpose === "SIGNUP") {
      return {
        signupVerificationToken: signSignupVerificationToken({
          kind: "SIGNUP_VERIFICATION",
          phoneCountryCode: countryCode,
          phoneNumber
        }),
        verifiedPhone: { countryCode, phoneNumber }
      };
    }

    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, "This phone number is not registered with us. Kindly sign up.", 404);
    }
    await prisma.user.update({ where: { id: user.id }, data: { phoneCountryCode: countryCode, statusCode: "01", lastLoginAt: new Date() } });

    const session = await this.createSession(user.id, user.email, res);
    if (user.email) {
      emailService.sendLoginNotice(user.email, { name: user.name, ...context }).catch((error) => {
        console.warn("[ZyNex Email] Login notice failed", error);
      });
    }
    return { user: { id: session.userId, email: session.email }, accessToken: session.accessToken };
  }

  async registerManual(input: {
    email?: string;
    phoneCountryCode?: string;
    phoneNumber?: string;
    signupVerificationToken?: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    password: string;
    termsAccepted: true;
  }, res: Response) {
    if (!input.email && !input.phoneNumber) {
      throw new AppError(ErrorCode.MISSING_REQUIRED_FIELD, "Email or phone number is required.", 400);
    }

    if (input.signupVerificationToken) {
      try {
        const verified = verifySignupVerificationToken(input.signupVerificationToken);
        if (verified.kind !== "SIGNUP_VERIFICATION") throw new Error("Invalid token kind");
        if (verified.email && verified.email !== input.email) throw new Error("Verified email mismatch");
        if (verified.phoneNumber && verified.phoneNumber !== input.phoneNumber) throw new Error("Verified phone mismatch");
      } catch {
        throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Signup verification expired. Please verify again.", 401);
      }
    }

    const passwordHash = await hashSecret(input.password);
    const existingUser = input.email
      ? await prisma.user.findUnique({ where: { email: input.email } })
      : input.phoneNumber
        ? await prisma.user.findUnique({ where: { phoneNumber: input.phoneNumber } })
        : null;

    if (existingUser) {
      throw new AppError(ErrorCode.EMAIL_ALREADY_EXISTS, "Account already exists. Please login.", 409);
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        phoneCountryCode: input.phoneCountryCode,
        phoneNumber: input.phoneNumber,
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

    const session = await this.createSession(user.id, input.email ?? null, res);
    if (user.email) {
      emailService.sendWelcomeEmail(user.email, user.name).catch((error) => {
        console.warn("[ZyNex Email] Welcome email failed", error);
      });
    }
    return session;
  }

  async loginPassword(email: string, password: string, res: Response, context?: { ipAddress?: string; userAgent?: string }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials", 401);
    const valid = await verifySecret(user.passwordHash, password);
    if (!valid) throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid credentials", 401);
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), statusCode: "01" } });
    const session = await this.createSession(user.id, email, res);
    emailService.sendLoginNotice(email, { name: user.name, ...context }).catch((error) => {
      console.warn("[ZyNex Email] Login notice failed", error);
    });
    return session;
  }

  async createSession(userId: string, email: string | null, res: Response) {
    const activeSessions = await prisma.session.findMany({
      where: { userId, statusCode: "01", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      skip: 1
    });
    if (activeSessions.length) {
      await prisma.session.updateMany({
        where: { id: { in: activeSessions.map((session) => session.id) } },
        data: { statusCode: "09", revokedAt: new Date() }
      });
    }

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

  async updateProfile(userId: string, input: { firstName: string; lastName: string; dateOfBirth?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: `${input.firstName} ${input.lastName}` },
      include: { profile: true }
    });

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null
      },
      create: {
        userId,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null
      }
    });

    return { ...user, profile };
  }

  async startEmailChange(userId: string, newEmail: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.email) throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, "Current email is required before changing email.", 404);

    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== userId) throw new AppError(ErrorCode.EMAIL_ALREADY_EXISTS, "This email is already registered.", 409);

    const digits = await configService.getNumber("AuthOtpDigits");
    const expiresMinutes = await configService.getNumber("AuthOtpExpiresMinutes");
    const maxAttempts = await configService.getNumber("AuthOtpMaxAttempts");
    const code = generateNumericCode(digits);
    const identifier = `EMAIL_CHANGE:${userId}:${newEmail}`;

    await prisma.verificationCode.updateMany({
      where: { identifier, purpose: "SIGNUP", status: "PENDING" },
      data: { status: "EXPIRED" }
    });
    await prisma.verificationCode.create({
      data: {
        identifier,
        codeHash: await hashOtp(code),
        purpose: "SIGNUP",
        maxAttempts,
        expiresAt: addMinutes(new Date(), expiresMinutes)
      }
    });

    await emailService.sendEmailChangeCode(user.email, code, newEmail);
    return { currentEmail: user.email, newEmail, digits, expiresInMinutes: expiresMinutes };
  }

  async verifyEmailChange(userId: string, newEmail: string, code: string) {
    const identifier = `EMAIL_CHANGE:${userId}:${newEmail}`;
    const verification = await prisma.verificationCode.findFirst({
      where: { identifier, purpose: "SIGNUP", status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid or expired email change code.", 401);
    }
    const valid = await verifyOtp(verification.codeHash, code);
    if (!valid) {
      await prisma.verificationCode.update({ where: { id: verification.id }, data: { attempts: { increment: 1 } } });
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid email change code.", 401);
    }

    await prisma.verificationCode.update({ where: { id: verification.id }, data: { status: "CONSUMED", consumedAt: new Date() } });
    return prisma.user.update({ where: { id: userId }, data: { email: newEmail }, include: { profile: true } });
  }

  async startPhoneChange(userId: string, countryCode: string, phoneNumber: string) {
    const existing = await prisma.user.findUnique({ where: { phoneNumber } });
    if (existing && existing.id !== userId) throw new AppError(ErrorCode.EMAIL_ALREADY_EXISTS, "This phone number is already registered.", 409);

    const digits = await configService.getNumber("AuthOtpDigits");
    const expiresMinutes = await configService.getNumber("AuthOtpExpiresMinutes");
    const maxAttempts = await configService.getNumber("AuthOtpMaxAttempts");
    const code = generateNumericCode(digits);
    const identifier = `PHONE_CHANGE:${userId}:${countryCode}${phoneNumber}`;

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

    const delivery = await smsService.sendVerificationCode(`${countryCode}${phoneNumber}`, code);
    return { countryCode, phoneNumber, digits, expiresInMinutes: expiresMinutes, delivery };
  }

  async verifyPhoneChange(userId: string, countryCode: string, phoneNumber: string, code: string) {
    const identifier = `PHONE_CHANGE:${userId}:${countryCode}${phoneNumber}`;
    const verification = await prisma.verificationCode.findFirst({
      where: { identifier, purpose: "PHONE_LOGIN", status: "PENDING" },
      orderBy: { createdAt: "desc" }
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid or expired phone change code.", 401);
    }
    const valid = await verifyOtp(verification.codeHash, code);
    if (!valid) {
      await prisma.verificationCode.update({ where: { id: verification.id }, data: { attempts: { increment: 1 } } });
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, "Invalid phone change code.", 401);
    }

    await prisma.verificationCode.update({ where: { id: verification.id }, data: { status: "CONSUMED", consumedAt: new Date() } });
    return prisma.user.update({ where: { id: userId }, data: { phoneCountryCode: countryCode, phoneNumber }, include: { profile: true } });
  }

  async deleteAccount(userId: string, confirmation: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user) throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, "Account not found.", 404);

    const profileName = (user.name || `${user.profile?.firstName || ""} ${user.profile?.lastName || ""}`.trim() || user.email || user.id).trim();
    const requiredConfirmation = `delete my profile ${profileName}`;
    if (confirmation !== requiredConfirmation) {
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, `Please type "${requiredConfirmation}" to delete your account.`, 400, {
        requiredConfirmation
      });
    }

    await prisma.$transaction(async (tx) => {
      const conversations = await tx.conversation.findMany({ where: { userId }, select: { id: true } });
      const conversationIds = conversations.map((conversation) => conversation.id);
      const inferenceLogs = await tx.inferenceLog.findMany({ where: { userId }, select: { id: true } });
      const inferenceLogIds = inferenceLogs.map((log) => log.id);

      if (inferenceLogIds.length) {
        await tx.redactionEvent.deleteMany({ where: { inferenceLogId: { in: inferenceLogIds } } });
        await tx.errorEvent.deleteMany({ where: { inferenceLogId: { in: inferenceLogIds } } });
      }

      await tx.inferenceLog.deleteMany({ where: { userId } });
      if (conversationIds.length) {
        await tx.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
      }
      await tx.conversation.deleteMany({ where: { userId } });
      await tx.termsAcceptance.deleteMany({ where: { userId } });
      await tx.authAuditLog.deleteMany({ where: { userId } });
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.userProfile.deleteMany({ where: { userId } });
      await tx.verificationCode.deleteMany({
        where: {
          OR: [
            user.email ? { identifier: user.email } : undefined,
            user.phoneNumber && user.phoneCountryCode ? { identifier: `${user.phoneCountryCode}${user.phoneNumber}` } : undefined,
            { identifier: { startsWith: `EMAIL_CHANGE:${userId}:` } },
            { identifier: { startsWith: `PHONE_CHANGE:${userId}:` } }
          ].filter(Boolean) as Array<{ identifier: string } | { identifier: { startsWith: string } }>
        }
      });
      await tx.user.delete({ where: { id: userId } });
    });

    return { deleted: true };
  }
}

export const authService = new AuthService();
