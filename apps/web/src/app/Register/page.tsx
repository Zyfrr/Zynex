import type { Metadata } from "next";
import { AuthFlow } from "@/components/auth/AuthFlow";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free ZyNex account using Google, phone OTP, or email verification to start multi-turn AI chatbot conversations with inference logging."
};

export default function RegisterPage() {
  return <AuthFlow mode="signup" />;
}
