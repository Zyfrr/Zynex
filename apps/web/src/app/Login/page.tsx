import type { Metadata } from "next";
import { AuthFlow } from "@/components/auth/AuthFlow";

export const metadata: Metadata = {
  title: "Login",
  description:
    "Login to ZyNex with Google, phone OTP, email verification code, or password to access AI chatbot conversations and LLM inference observability."
};

export default function LoginPage() {
  return <AuthFlow mode="login" />;
}
