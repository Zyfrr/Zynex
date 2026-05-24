export const authConfigDefaults = {
  otpDigits: 6,
  otpExpiresMinutes: 10,
  otpMaxAttempts: 5,
  otpResendCooldownSeconds: 60,
  passwordResetExpiresMinutes: 30,
  inactiveUserDays: 30,
  supportSenderEmail: "support@zyfrr.com",
  defaultPhoneCountryCode: "+91"
} as const;
