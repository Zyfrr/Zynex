import type { Metadata } from "next";
import { ChatWorkspace } from "@/components/chat/ChatWorkspace";

export const metadata: Metadata = {
  title: "AI Chat Workspace",
  description:
    "Use ZyNex as a ChatGPT-style AI chatbot workspace with conversation history, projects, temporary chat, file and voice controls, streaming response readiness, and LLM inference logging metadata."
};

export default function ChatPage() {
  return <ChatWorkspace />;
}
