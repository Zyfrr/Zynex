import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../../config/env";

export class EmailService {
  async sendVerificationCode(to: string, code: string, purpose: "LOGIN" | "SIGNUP" | "PASSWORD_RESET" = "LOGIN") {
    const copy = getOtpCopy(purpose);
    if (env.RESEND_API_KEY) {
      const resend = new Resend(env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: env.ZYNEX_EMAIL_FROM,
        to,
        subject: copy.subject,
        text: `${copy.title}: ${code}. This code expires soon.`,
        html: this.renderTemplate({
          eyebrow: copy.eyebrow,
          title: copy.title,
          body: copy.body,
          code,
          footnote: "This code expires soon. If you did not request it, you can ignore this email."
        })
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
      subject: copy.subject,
      text: `${copy.title}: ${code}. This code expires soon.`,
      html: this.renderTemplate({
        eyebrow: copy.eyebrow,
        title: copy.title,
        body: copy.body,
        code,
        footnote: "This code expires soon. If you did not request it, you can ignore this email."
      })
    });

    return { delivered: true, mode: "SMTP" };
  }

  async sendWelcomeEmail(to: string, name?: string | null) {
    return this.sendSystemEmail({
      to,
      subject: "Welcome to ZyNex",
      text: `Welcome${name ? ` ${name}` : ""} to ZyNex. Your account is ready. You can now explore secure AI chat, inference logs, and workspace controls.`,
      html: this.renderTemplate({
        eyebrow: "Account created",
        title: `Welcome to ZyNex${name ? `, ${name}` : ""}`,
        body: "Your account is ready. You can now explore secure AI chat, inference logs, provider monitoring, recharge controls, and workspace settings.",
        details: [
          ["Product", "ZyNex AI chat observability"],
          ["Support", "support@zyfrr.com"],
          ["Next step", "Open your dashboard and complete workspace setup"]
        ],
        footnote: "Thank you for registering with ZyNex."
      })
    });
  }

  async sendEmailChangeCode(to: string, code: string, newEmail: string) {
    return this.sendSystemEmail({
      to,
      subject: "Confirm your ZyNex email change",
      text: `A request was made to change your ZyNex account email to ${newEmail}. Your verification code is ${code}.`,
      html: this.renderTemplate({
        eyebrow: "Security verification",
        title: "Confirm your email change",
        body: `A request was made to change your ZyNex account email to ${newEmail}. Use the verification code below to approve this change.`,
        code,
        footnote: "If you did not request this change, please contact support immediately."
      })
    });
  }

  async sendLoginNotice(to: string, context: { name?: string | null; ipAddress?: string; userAgent?: string }) {
    const loginTime = new Date().toISOString();
    return this.sendSystemEmail({
      to,
      subject: "New ZyNex login",
      text: `Your ZyNex account was accessed at ${loginTime}. IP: ${context.ipAddress || "Unknown"}. Device: ${context.userAgent || "Unknown"}.`,
      html: this.renderTemplate({
        eyebrow: "Account activity",
        title: "New ZyNex login",
        body: `Your ZyNex account${context.name ? ` for ${context.name}` : ""} was accessed.`,
        details: [
          ["Time", loginTime],
          ["IP", context.ipAddress || "Unknown"],
          ["Device", context.userAgent || "Unknown"]
        ],
        footnote: "If this was not you, please reset your password immediately."
      })
    });
  }

  private async sendSystemEmail(input: { to: string; subject: string; text: string; html: string }) {
    if (env.RESEND_API_KEY) {
      const resend = new Resend(env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: env.ZYNEX_EMAIL_FROM,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      return { delivered: true, mode: "RESEND", id: result.data?.id };
    }

    if (!env.SPACESHIP_SMTP_HOST || !env.SPACESHIP_SMTP_PASS) {
      console.log(`[ZyNex Email Dev] ${input.subject} -> ${input.to}`);
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
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html
    });

    return { delivered: true, mode: "SMTP" };
  }

  private renderTemplate(input: {
    eyebrow: string;
    title: string;
    body: string;
    code?: string;
    details?: Array<[string, string]>;
    footnote?: string;
  }) {
    const detailsHtml = input.details?.length
      ? `
        <table style="width:100%; border-collapse:collapse; margin: 18px 0;">
          ${input.details.map(([label, value]) => `
            <tr>
              <td style="padding:10px 0; color:#64748B; border-bottom:1px solid #E8EEF7;">${label}</td>
              <td style="padding:10px 0; color:#111827; font-weight:600; text-align:right; border-bottom:1px solid #E8EEF7;">${value}</td>
            </tr>
          `).join("")}
        </table>
      `
      : "";

    return `
      <div style="margin:0; padding:32px; background:#F7F8FB; font-family:Inter, Arial, sans-serif; color:#111827;">
        <div style="max-width:560px; margin:0 auto; background:#FFFFFF; border:1px solid #E8EEF7; border-radius:18px; overflow:hidden;">
          <div style="padding:24px 28px; border-bottom:1px solid #E8EEF7;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="height:36px; width:36px; border-radius:999px; background:#4F46E5; color:#FFFFFF; display:inline-grid; place-items:center; font-weight:800;">Z</div>
              <div>
                <div style="font-size:20px; font-weight:800;">ZyNex</div>
                <div style="font-size:12px; color:#64748B; font-weight:600;">Secure AI chat observability</div>
              </div>
            </div>
          </div>
          <div style="padding:28px;">
            <div style="font-size:12px; text-transform:uppercase; color:#4F46E5; font-weight:800; letter-spacing:0.04em;">${input.eyebrow}</div>
            <h1 style="margin:10px 0 12px; font-size:28px; line-height:1.08; color:#111827;">${input.title}</h1>
            <p style="margin:0; color:#475569; line-height:1.7;">${input.body}</p>
            ${input.code ? `<div style="margin:22px 0; padding:18px; text-align:center; border-radius:14px; background:#F8FAFC; border:1px solid #E8EEF7; font-size:30px; letter-spacing:8px; color:#4F46E5; font-weight:800;">${input.code}</div>` : ""}
            ${detailsHtml}
            ${input.footnote ? `<p style="margin:18px 0 0; color:#64748B; font-size:13px; line-height:1.6;">${input.footnote}</p>` : ""}
          </div>
          <div style="padding:18px 28px; background:#F8FAFC; color:#64748B; font-size:12px; line-height:1.6;">
            ZyNex Support<br />
            support@zyfrr.com
          </div>
        </div>
      </div>
    `;
  }
}

export const emailService = new EmailService();

function getOtpCopy(purpose: "LOGIN" | "SIGNUP" | "PASSWORD_RESET") {
  if (purpose === "SIGNUP") {
    return {
      subject: "Your ZyNex signup verification OTP",
      eyebrow: "Signup verification",
      title: "Your signup OTP",
      body: "Use this code to verify your email and continue creating your ZyNex account."
    };
  }
  if (purpose === "PASSWORD_RESET") {
    return {
      subject: "Your ZyNex password reset OTP",
      eyebrow: "Password reset",
      title: "Your password reset OTP",
      body: "Use this code to continue resetting your ZyNex password."
    };
  }
  return {
    subject: "Your ZyNex login OTP",
    eyebrow: "Login verification",
    title: "Your login OTP",
    body: "Use this code to securely log in to your ZyNex account."
  };
}
