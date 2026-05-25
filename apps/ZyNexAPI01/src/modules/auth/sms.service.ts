import twilio from "twilio";
import { env } from "../../config/env";

export class SmsService {
  async sendVerificationCode(to: string, code: string, purpose: "LOGIN" | "SIGNUP" = "LOGIN") {
    const label = purpose === "SIGNUP" ? "signup verification OTP" : "login OTP";
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_PHONE) {
      console.log(`[ZyNex SMS Dev] ${to} ${label}: ${code}`);
      return { delivered: false, mode: "CONSOLE" };
    }

    const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: env.TWILIO_FROM_PHONE,
      to,
      body: `Your ZyNex ${label} is ${code}.`
    });

    return { delivered: true, mode: "TWILIO" };
  }
}

export const smsService = new SmsService();
