import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  password: z.string().min(8),
  termsAccepted: z.literal(true)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const emailStartSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["LOGIN", "SIGNUP", "PASSWORD_RESET"]).default("LOGIN")
});

export const emailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{4,8}$/)
});

export const phoneStartSchema = z.object({
  countryCode: z.string().regex(/^\+\d{1,4}$/).default("+91"),
  phoneNumber: z.string().regex(/^\d{6,14}$/)
});

export const phoneVerifySchema = phoneStartSchema.extend({
  code: z.string().regex(/^\d{4,8}$/)
});

export const passwordResetStartSchema = z.object({
  email: z.string().email()
});
