import type { Metadata } from "next";
import { Darker_Grotesque, IBM_Plex_Mono, Inter } from "next/font/google";
import { SessionProviderShell } from "@/components/providers/SessionProviderShell";
import "./globals.css";

const darkerGrotesque = Darker_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap"
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zynex.ai"),
  title: {
    default: "ZyNex | AI Chatbot, LLM Inference Logging, and Observability",
    template: "%s | ZyNex"
  },
  description:
    "ZyNex is an AI chatbot workspace for multi-turn conversations, streaming LLM responses, inference logging, latency analytics, token usage tracking, provider observability, and ingestion pipeline monitoring.",
  keywords: [
    "ZyNex",
    "AI chatbot",
    "LLM observability",
    "inference logging",
    "LLM ingestion pipeline",
    "streaming AI responses",
    "multi provider LLM",
    "token usage analytics",
    "latency dashboard",
    "AI conversation monitoring"
  ],
  applicationName: "ZyNex",
  authors: [{ name: "ZyNex" }],
  creator: "ZyNex",
  publisher: "ZyNex",
  icons: {
    icon: "/assets/zynex-logos/zynex_favicon.svg",
    shortcut: "/assets/zynex-logos/zynex_favicon.svg",
    apple: "/assets/zynex-logos/zynex_favicon.svg"
  },
  openGraph: {
    title: "ZyNex | AI Chatbot and LLM Inference Observability",
    description:
      "Run ChatGPT-style AI conversations while capturing provider, model, latency, token usage, request status, errors, session IDs, and input/output previews in near real time.",
    url: "https://zynex.ai",
    siteName: "ZyNex",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "ZyNex | AI Chatbot and LLM Observability",
    description:
      "A production-style AI chat workspace with inference logging, ingestion, streaming responses, and observability dashboards."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${darkerGrotesque.variable} ${inter.variable} ${ibmPlexMono.variable}`}>
        <SessionProviderShell>{children}</SessionProviderShell>
      </body>
    </html>
  );
}
