import type { Metadata } from "next";
import { SessionProviderShell } from "@/components/providers/SessionProviderShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZyNex | LLM Inference Observability",
  description:
    "ZyNex is a premium AI roleplay chatbot and LLM inference logging platform."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProviderShell>{children}</SessionProviderShell>
      </body>
    </html>
  );
}
