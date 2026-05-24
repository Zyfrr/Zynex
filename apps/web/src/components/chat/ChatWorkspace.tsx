"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { ChatMain } from "@/components/chat/ChatMain";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

export function ChatWorkspace() {
  const [collapsed, setCollapsed] = useState(false);
  const [temporaryChat, setTemporaryChat] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);

  return (
    <main className="min-h-screen bg-[#F7F8FB] text-[#111827]">
      <div className="flex h-screen overflow-hidden">
        <ChatSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          projectsOpen={projectsOpen}
          setProjectsOpen={setProjectsOpen}
          recentOpen={recentOpen}
          setRecentOpen={setRecentOpen}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          authenticated={Boolean(user)}
          onLoginClick={() => setAuthMode("login")}
        />
        <ChatMain
          temporaryChat={temporaryChat}
          setTemporaryChat={setTemporaryChat}
          attachOpen={attachOpen}
          setAttachOpen={setAttachOpen}
          recording={recording}
          setRecording={setRecording}
          prompt={prompt}
          setPrompt={setPrompt}
          authenticated={Boolean(user)}
          onLoginClick={() => setAuthMode("login")}
          onSignupClick={() => setAuthMode("signup")}
        />
      </div>
      {authMode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-4 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-[520px] overflow-y-auto rounded-[28px] border border-[#E8EEF7] bg-white p-6 shadow-2xl shadow-slate-950/20">
            <button
              type="button"
              aria-label="Close auth modal"
              onClick={() => setAuthMode(null)}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#E8EEF7] text-[#4C596C] hover:text-[#4F46E5]"
            >
              <X size={18} />
            </button>
            <AuthFlow
              mode={authMode}
              compact
              onAuthenticated={(nextUser) => {
                setUser(nextUser);
                setAuthMode(null);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
