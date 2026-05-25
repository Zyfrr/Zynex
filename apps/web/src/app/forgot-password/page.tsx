"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { ZyNexApiError, zynexApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendResetOtp() {
    try {
      setLoading(true);
      await zynexApi("/api/v1/auth/ZyNexAPI01AuthPasswordResetStart", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      toast.success("Code: PASSWORD_RESET_OTP", { description: "Message: Password reset OTP sent to your email." });
    } catch (error) {
      if (error instanceof ZyNexApiError) toast.error(`Code: ${error.code}`, { description: `Message: ${error.message}` });
      else toast.error("Code: SYS001", { description: "Message: Unable to start password reset." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F7F8FB] px-4 text-[#111827]">
      <section className="w-full max-w-md rounded-2xl border border-[#E8EEF7] bg-white p-6 shadow-[0_24px_70px_rgba(15,36,66,0.10)]">
        <p className="font-body text-xs font-bold uppercase text-[#4F46E5]">Password recovery</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-none">Forgot password</h1>
        <p className="mt-3 font-body text-sm leading-6 text-[#64748B]">
          Enter your registered email. We will send a password reset OTP.
        </p>
        <label className="mt-6 block">
          <span className="font-body text-sm font-semibold text-[#253248]">Email address</span>
          <div className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-[#DDE5F0] px-3">
            <Mail size={17} className="text-[#64748B]" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="min-w-0 flex-1 bg-transparent font-body text-sm outline-none" />
          </div>
        </label>
        <button type="button" disabled={!email || loading} onClick={sendResetOtp} className="mt-5 h-11 w-full rounded-full bg-[#4F46E5] font-body text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
          {loading ? "Sending OTP" : "Send reset OTP"}
        </button>
        <Link href="/Login" className="mt-4 block text-center font-body text-sm font-semibold text-[#4F46E5]">Back to login</Link>
      </section>
    </main>
  );
}
