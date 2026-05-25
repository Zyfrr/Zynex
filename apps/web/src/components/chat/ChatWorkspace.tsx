"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { ChatMain } from "@/components/chat/ChatMain";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

type WorkspaceUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function ChatWorkspace() {
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [temporaryChat, setTemporaryChat] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
  const activeUser = user ?? session?.user ?? null;

  function openAuth(nextMode: "login" | "signup") {
    setAuthMode(nextMode);
    window.history.pushState(null, "", nextMode === "login" ? "/Login" : "/Register");
  }

  function closeAuth() {
    setAuthMode(null);
    window.history.pushState(null, "", "/");
  }

  return (
    <main className="min-h-screen bg-[#F7F8FB] text-[#111827]">
      <div className="flex h-screen overflow-hidden">
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/35 backdrop-blur-[2px] md:hidden"
          />
        )}
        <ChatSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          projectsOpen={projectsOpen}
          setProjectsOpen={setProjectsOpen}
          recentOpen={recentOpen}
          setRecentOpen={setRecentOpen}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          user={activeUser}
          authenticated={Boolean(activeUser)}
          onLoginClick={() => openAuth("login")}
        />
        <ChatMain
          onOpenSidebar={() => {
            setCollapsed(false);
            setMobileSidebarOpen(true);
          }}
          temporaryChat={temporaryChat}
          setTemporaryChat={setTemporaryChat}
          attachOpen={attachOpen}
          setAttachOpen={setAttachOpen}
          recording={recording}
          setRecording={setRecording}
          prompt={prompt}
          setPrompt={setPrompt}
          user={activeUser}
          authenticated={Boolean(activeUser)}
          onLoginClick={() => openAuth("login")}
          onSignupClick={() => openAuth("signup")}
        />
      </div>
      {authMode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-2 py-2 backdrop-blur-sm sm:px-4">
          <div className="relative w-full max-w-[min(94vw,860px)] rounded-[18px] border border-[#E8EEF7] bg-white p-3 shadow-2xl shadow-slate-950/20 sm:rounded-[28px] sm:p-5">
            <button
              type="button"
              aria-label="Close auth modal"
              onClick={closeAuth}
              className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#E8EEF7] text-[#4C596C] hover:text-[#4F46E5]"
            >
              <X size={18} />
            </button>
            <AuthFlow
              mode={authMode}
              compact
              onAuthenticated={(nextUser) => {
                setUser(nextUser);
                closeAuth();
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
