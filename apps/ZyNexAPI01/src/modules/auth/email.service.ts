import nodemailer from "nodemailer";
import { env } from "../../config/env";

export class EmailService {
  async sendVerificationCode(to: string, code: string) {
    if (!env.SPACESHIP_SMTP_HOST || !env.SPACESHIP_SMTP_PASS) {
      console.log(`[ZyNex Email Dev] ${to} verification code: ${code}`);
      return { delivered: false, mode: "CONSOLE" };
    }

    const transporter = nodemailer.createTransport({
      host: env.SPACESHIP_SMTP_HOST,
      port: env.SPACESHIP_SMTP_PORT,
      secure: env.SPACESHIP_SMTP_PORT === 465,
      auth: {
        user: env.SPACESHIP_SMTP_USER,
        pass: env.SPACESHIP_SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"ZyNex Support" <${env.ZYNEX_SUPPORT_EMAIL}>`,
      to,
      subject: "Your ZyNex verification code",
      text: `Your ZyNex verification code is ${code}. This code expires soon.`,
      html: `<p>Your ZyNex verification code is <strong>${code}</strong>.</p><p>This code expires soon.</p>`
    });

    return { delivered: true, mode: "SMTP" };
  }
}

export const emailService = new EmailService();
