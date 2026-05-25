import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../../config/env";

export class EmailService {
  async sendVerificationCode(to: string, code: string) {
    if (env.RESEND_API_KEY) {
      const resend = new Resend(env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: env.ZYNEX_EMAIL_FROM,
        to,
        subject: "Your ZyNex verification code",
        text: `Your ZyNex verification code is ${code}. This code expires soon.`,
        html: `
          <div style="font-family: Inter, Arial, sans-serif; color: #111827; line-height: 1.6;">
            <p>Your ZyNex verification code is:</p>
            <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #4F46E5;">${code}</p>
            <p>This code expires soon. If you did not request this code, you can ignore this email.</p>
          </div>
        `
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { delivered: true, mode: "RESEND", id: result.data?.id };
    }

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
      from: `"ZyNex Support" <${env.SPACESHIP_SMTP_USER}>`,
      to,
      subject: "Your ZyNex verification code",
      text: `Your ZyNex verification code is ${code}. This code expires soon.`,
      html: `<p>Your ZyNex verification code is <strong>${code}</strong>.</p><p>This code expires soon.</p>`
    });

    return { delivered: true, mode: "SMTP" };
  }
}

export const emailService = new EmailService();
