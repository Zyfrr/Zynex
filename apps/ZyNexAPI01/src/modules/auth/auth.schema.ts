import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().optional(),
  phoneCountryCode: z.string().regex(/^\+\d{1,4}$/).optional(),
  phoneNumber: z.string().regex(/^\d{6,14}$/).optional(),
  signupVerificationToken: z.string().min(16).optional(),
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

export const authLookupSchema = z.object({
  identifier: z.string().min(3),
  countryCode: z.string().regex(/^\+\d{1,4}$/).default("+91").optional()
});

export const emailStartSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["LOGIN", "SIGNUP", "PASSWORD_RESET"]).default("LOGIN")
});

export const emailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{4,8}$/),
  purpose: z.enum(["LOGIN", "SIGNUP"]).default("LOGIN")
});

export const phoneStartSchema = z.object({
  countryCode: z.string().regex(/^\+\d{1,4}$/).default("+91"),
  phoneNumber: z.string().regex(/^\d{6,14}$/),
  purpose: z.enum(["LOGIN", "SIGNUP"]).default("LOGIN")
});

export const phoneVerifySchema = phoneStartSchema.extend({
  code: z.string().regex(/^\d{4,8}$/)
});

export const passwordResetStartSchema = z.object({
  email: z.string().email()
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional()
});

export const emailChangeStartSchema = z.object({
  newEmail: z.string().email()
});

export const emailChangeVerifySchema = emailChangeStartSchema.extend({
  code: z.string().regex(/^\d{4,8}$/)
});

export const phoneChangeStartSchema = z.object({
  countryCode: z.string().regex(/^\+\d{1,4}$/).default("+91"),
  phoneNumber: z.string().regex(/^\d{6,14}$/)
});

export const phoneChangeVerifySchema = phoneChangeStartSchema.extend({
  code: z.string().regex(/^\d{4,8}$/)
});

export const deleteAccountSchema = z.object({
  confirmation: z.string().min(3)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});
