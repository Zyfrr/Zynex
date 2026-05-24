import { Router } from "express";
import { authConfigDefaults } from "@/config/authConfig";
import { asyncHandler } from "@/utils/asyncHandler";
import { authService } from "./auth.service";
import {
  emailStartSchema,
  emailVerifySchema,
  loginSchema,
  passwordResetStartSchema,
  phoneStartSchema,
  phoneVerifySchema,
  registerSchema
} from "./auth.schema";

export const authRouter = Router();

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
    const session = await authService.loginPassword(body.email, body.password, res);
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
    const session = await authService.verifyEmailCode(body.email, body.code, res);
    res.json({
      success: true,
      data: {
        verified: true,
        identifier: body.email,
        user: { id: session.userId, email: session.email },
        accessToken: session.accessToken
      }
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthPhoneStart",
  asyncHandler(async (req, res) => {
    const body = phoneStartSchema.parse(req.body);
    const result = await authService.startPhoneCode(body.countryCode, body.phoneNumber);
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
    const session = await authService.verifyPhoneCode(body.countryCode, body.phoneNumber, body.code, res);
    res.json({
      success: true,
      data: {
        verified: true,
        identifier: `${body.countryCode}${body.phoneNumber}`,
        user: { id: session.userId, email: session.email },
        accessToken: session.accessToken
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
    const userId = req.header("x-zynex-user-id");
    const user = await authService.getCurrentUser(userId);
    res.json({
      success: true,
      data: user ?? null
    });
  })
);

authRouter.post(
  "/ZyNexAPI01AuthLogout",
  asyncHandler(async (_req, res) => {
    authService.clearSessionCookies(res);
    res.json({ success: true, data: { loggedOut: true } });
  })
);
