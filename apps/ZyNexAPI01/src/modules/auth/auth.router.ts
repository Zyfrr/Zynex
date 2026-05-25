import { Router } from "express";
import { authConfigDefaults } from "../../config/authConfig";
import { asyncHandler } from "../../utils/asyncHandler";
import { authService } from "./auth.service";
import {
  authLookupSchema,
  deleteAccountSchema,
  emailStartSchema,
  emailVerifySchema,
  emailChangeStartSchema,
  emailChangeVerifySchema,
  loginSchema,
  passwordResetStartSchema,
  profileUpdateSchema,
  phoneStartSchema,
  phoneChangeStartSchema,
  phoneChangeVerifySchema,
  phoneVerifySchema,
  registerSchema
} from "./auth.schema";
import { verifyAccessToken } from "./auth.tokens";

export const authRouter = Router();

function getUserIdFromRequest(req: { cookies?: Record<string, string>; header: (name: string) => string | undefined }) {
  const headerUserId = req.header("x-zynex-user-id");
  if (headerUserId) return headerUserId;
  const token = req.cookies?.ZyNexAccessToken;
  if (!token) return undefined;
  return verifyAccessToken(token).userId;
}

authRouter.post(
  "/ZyNexAPI01AuthLookup",
  asyncHandler(async (req, res) => {
    const body = authLookupSchema.parse(req.body);
    const result = await authService.lookupIdentifier(body.identifier, body.countryCode);
    res.json({
      success: true,
      data: result
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthRegisterManual",
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const session = await authService.registerManual(body, res);
    res.status(201).json({
      success: true,
      data: {
        user: { id: session.userId, email: session.email, statusCode: "01" },
        accessToken: session.accessToken
      }
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthLogin",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const session = await authService.loginPassword(body.email, body.password, res, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    res.json({
      success: true,
      data: {
        user: { id: session.userId, email: session.email, statusCode: "01" },
        accessToken: session.accessToken
      }
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthEmailStart",
  asyncHandler(async (req, res) => {
    const body = emailStartSchema.parse(req.body);
    const result = await authService.startEmailCode(body.email, body.purpose);
    res.status(202).json({
      success: true,
      data: { ...result, sender: authConfigDefaults.supportSenderEmail }
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthEmailVerify",
  asyncHandler(async (req, res) => {
    const body = emailVerifySchema.parse(req.body);
    const session = await authService.verifyEmailCode(body.email, body.code, body.purpose, res, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    res.json({
      success: true,
      data: {
        verified: true,
        identifier: body.email,
        ...session
      }
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthPhoneStart",
  asyncHandler(async (req, res) => {
    const body = phoneStartSchema.parse(req.body);
    const result = await authService.startPhoneCode(body.countryCode, body.phoneNumber, body.purpose);
    res.status(202).json({
      success: true,
      data: { ...result, provider: "TWILIO" }
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthPhoneVerify",
  asyncHandler(async (req, res) => {
    const body = phoneVerifySchema.parse(req.body);
    const session = await authService.verifyPhoneCode(body.countryCode, body.phoneNumber, body.code, body.purpose, res, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });
    res.json({
      success: true,
      data: {
        verified: true,
        identifier: `${body.countryCode}${body.phoneNumber}`,
        ...session
      }
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthPasswordResetStart",
  asyncHandler(async (req, res) => {
    const body = passwordResetStartSchema.parse(req.body);
    res.status(202).json({
      success: true,
      data: {
        identifier: body.email,
        sender: authConfigDefaults.supportSenderEmail,
        expiresInMinutes: authConfigDefaults.passwordResetExpiresMinutes
      }
    });
  })
);

authRouter.get(
  "/ZyNexAPI01AuthMe",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    const user = await authService.getCurrentUser(userId);
    res.json({
      success: true,
      data: user ?? null
    });
  })
);

authRouter.patch(
  "/ZyNexAPI01AuthProfile",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const body = profileUpdateSchema.parse(req.body);
    const user = await authService.updateProfile(userId, body);
    res.json({ success: true, data: user });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthEmailChangeStart",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const body = emailChangeStartSchema.parse(req.body);
    const result = await authService.startEmailChange(userId, body.newEmail);
    res.status(202).json({ success: true, data: result });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthEmailChangeVerify",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const body = emailChangeVerifySchema.parse(req.body);
    const user = await authService.verifyEmailChange(userId, body.newEmail, body.code);
    res.json({ success: true, data: user });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthPhoneChangeStart",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const body = phoneChangeStartSchema.parse(req.body);
    const result = await authService.startPhoneChange(userId, body.countryCode, body.phoneNumber);
    res.status(202).json({ success: true, data: result });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthPhoneChangeVerify",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const body = phoneChangeVerifySchema.parse(req.body);
    const user = await authService.verifyPhoneChange(userId, body.countryCode, body.phoneNumber, body.code);
    res.json({ success: true, data: user });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthLogout",
  asyncHandler(async (_req, res) => {
    authService.clearSessionCookies(res);
    res.json({ success: true, data: { loggedOut: true } });
  })
);

authRouter.delete(
  "/ZyNexAPI01AuthAccount",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const body = deleteAccountSchema.parse(req.body);
    const result = await authService.deleteAccount(userId, body.confirmation);
    authService.clearSessionCookies(res);
    res.json({ success: true, data: result });
  })
);
