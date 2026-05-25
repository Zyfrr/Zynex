import { prisma } from "../../config/database";
import { authConfigDefaults } from "../../config/authConfig";

type ConfigPrimitive = string | number | boolean;

function coerceConfigValue(value: string, type: string): ConfigPrimitive {
  if (type === "NUMBER") return Number(value);
  if (type === "BOOLEAN") return value === "true";
  return value;
}

export class ConfigService {
  private fallback: Record<string, ConfigPrimitive> = {
    AuthOtpDigits: authConfigDefaults.otpDigits,
    AuthOtpExpiresMinutes: authConfigDefaults.otpExpiresMinutes,
    AuthOtpMaxAttempts: authConfigDefaults.otpMaxAttempts,
    AuthOtpResendCooldownSeconds: authConfigDefaults.otpResendCooldownSeconds,
    AuthPasswordResetExpiresMinutes: authConfigDefaults.passwordResetExpiresMinutes,
    AuthInactiveUserDays: authConfigDefaults.inactiveUserDays,
    AuthSupportSenderEmail: authConfigDefaults.supportSenderEmail,
    AuthDefaultPhoneCountryCode: authConfigDefaults.defaultPhoneCountryCode
  };

  async getNumber(key: string) {
    const value = await this.get(key);
    return Number(value);
  }

  async getString(key: string) {
    const value = await this.get(key);
    return String(value);
  }

  async get(key: string) {
    try {
      const row = await prisma.configParam.findUnique({ where: { key } });
      if (row?.isActive) return coerceConfigValue(row.value, row.valueType);
    } catch {
      // Database may not be migrated in early local setup; fallback keeps API bootable.
    }

    return this.fallback[key];
  }
}

export const configService = new ConfigService();
