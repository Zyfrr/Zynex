"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { ChatMain } from "@/components/chat/ChatMain";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { zynexApi } from "@/lib/api";

type WorkspaceUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  profile?: { firstName?: string | null; lastName?: string | null; avatarUrl?: string | null } | null;
};

type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
};

type Conversation = {
  id: string;
  title?: string | null;
  status: "ACTIVE" | "CANCELLED" | "ARCHIVED";
  provider: string;
  model: string;
  pinned?: boolean;
  projectId?: string | null;
  messages?: ChatMessage[];
  logs?: Array<{ latencyMs: number; status: string; totalTokens: number }>;
};

type Project = { id: string; name: string };
type ProviderName = "Claude" | "OpenAI" | "Gemini" | "OpenRouter" | "Groq";

const defaultProvider: ProviderName = "Groq";
const defaultModels: Record<ProviderName, string> = {
  OpenAI: "gpt-4.1-mini",
  Groq: "llama-3.3-70b-versatile",
  OpenRouter: "google/gemma-3-27b-it:free",
  Claude: "ClaudeSonnet45",
  Gemini: "gemini-1.5-flash"
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [provider, setProvider] = useState<ProviderName>(defaultProvider);
  const [model, setModel] = useState(defaultModels[defaultProvider]);
  const activeUser = user ?? session?.user ?? null;
  const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || null;

  async function refreshProfile() {
    try {
      const apiUser = await zynexApi<WorkspaceUser | null>("/api/v1/auth/ZyNexAPI01AuthMe");
      if (apiUser) {
        const profileName = [apiUser.profile?.firstName, apiUser.profile?.lastName].filter(Boolean).join(" ");
        setUser({
          ...apiUser,
          name: profileName || apiUser.name || apiUser.email,
          image: apiUser.profile?.avatarUrl || apiUser.image
        });
      } else {
        setUser(null);
      }
    } catch {
      if (!session?.user) setUser(null);
    }
  }

  useEffect(() => {
    void refreshProfile();
  }, [session?.user?.email]);

  useEffect(() => {
    if (activeUser) void refreshConversations();
  }, [activeUser?.email]);

  useEffect(() => {
    setProjects(readWorkspaceProjects());
  }, []);

  async function refreshConversations() {
    try {
      const items = await zynexApi<Conversation[]>("/api/v1/conversations/ZyNexAPI01ConversationsList");
      setConversations(mergeLocalConversationState(items));
      const nextActive = items.find((conversation) => conversation.status === "ACTIVE") || items[0] || null;
      if (!activeConversationId && nextActive) {
        setActiveConversationId(nextActive.id);
        setChatMessages(nextActive.messages || []);
      }
      if (activeConversationId) {
        const current = items.find((conversation) => conversation.id === activeConversationId);
        if (current) setChatMessages(current.messages || []);
      }
    } catch {
      setConversations([]);
    }
  }

  async function createConversation() {
    if (!activeUser) {
      openAuth("login");
      return;
    }
    const conversation = await zynexApi<Conversation>("/api/v1/conversations/ZyNexAPI01ConversationsCreate", {
      method: "POST",
      body: JSON.stringify({ title: "New conversation", provider, model })
    });
    const nextConversation = attachConversationToActiveProject(conversation);
    setConversations((items) => sortConversations([nextConversation, ...items]));
    setActiveConversationId(nextConversation.id);
    setChatMessages([]);
  }

  function createProject(name: string) {
    const project = { id: `project-${Date.now()}`, name };
    const nextProjects = [project, ...projects];
    setProjects(nextProjects);
    setActiveProjectId(project.id);
    writeWorkspaceProjects(nextProjects);
  }

  function selectProject(projectId: string | null) {
    setActiveProjectId(projectId);
  }

  async function selectConversation(conversation: Conversation) {
    setActiveConversationId(conversation.id);
    setChatMessages(conversation.messages || []);
    setMobileSidebarOpen(false);
  }

  async function cancelConversation() {
    if (!activeConversationId) return;
    await zynexApi(`/api/v1/conversations/ZyNexAPI01Conversations/${activeConversationId}/Cancel`, { method: "PATCH" });
    await refreshConversations();
  }

  async function renameConversation(conversationId: string, title: string) {
    await zynexApi(`/api/v1/conversations/ZyNexAPI01Conversations/${conversationId}/Rename`, {
      method: "PATCH",
      body: JSON.stringify({ title })
    });
    await refreshConversations();
  }

  async function deleteConversation(conversationId: string) {
    await zynexApi(`/api/v1/conversations/ZyNexAPI01Conversations/${conversationId}/Delete`, { method: "PATCH" });
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setChatMessages([]);
    }
    await refreshConversations();
  }

  function pinConversation(conversationId: string) {
    setConversations((items) => {
      const next = items.map((conversation) => conversation.id === conversationId ? { ...conversation, pinned: !conversation.pinned } : conversation);
      writePinnedConversationIds(next.filter((conversation) => conversation.pinned).map((conversation) => conversation.id));
      return sortConversations(next);
    });
  }

  function likeConversation(item: { id: string; title: string; preview: string }) {
    const liked = readLikedChats().filter((chat) => chat.id !== item.id);
    const nextLiked = [{ ...item, likedAt: new Date().toISOString() }, ...liked].slice(0, 50);
    window.localStorage.setItem("zynex-liked-chats", JSON.stringify(nextLiked));
    window.dispatchEvent(new Event("zynex-liked-chats-updated"));
  }

  function attachConversationToActiveProject(conversation: Conversation) {
    if (!activeProjectId) return conversation;
    const map = readProjectConversationMap();
    map[conversation.id] = activeProjectId;
    window.localStorage.setItem("zynex-project-conversations", JSON.stringify(map));
    return { ...conversation, projectId: activeProjectId };
  }

  async function sendPrompt(overridePrompt?: string) {
    const nextPrompt = (overridePrompt ?? prompt).trim();
    if (!nextPrompt || sending) return;
    if (!activeUser) {
      openAuth("login");
      return;
    }

    setSending(true);
    if (!overridePrompt) setPrompt("");
    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conversation = await zynexApi<Conversation>("/api/v1/conversations/ZyNexAPI01ConversationsCreate", {
          method: "POST",
          body: JSON.stringify({ title: nextPrompt.slice(0, 58), provider, model })
        });
        conversationId = conversation.id;
        setActiveConversationId(conversation.id);
        const nextConversation = attachConversationToActiveProject(conversation);
        setConversations((items) => sortConversations([nextConversation, ...items]));
      }

      const optimisticMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "USER",
        content: nextPrompt,
        createdAt: new Date().toISOString()
      };
      setChatMessages((items) => [...items, optimisticMessage]);

      const result = await zynexApi<{
        userMessage: ChatMessage;
        assistantMessage: ChatMessage;
      }>(`/api/v1/chat/ZyNexAPI01ChatConversations/${conversationId}/Messages`, {
        method: "POST",
        body: JSON.stringify({ message: nextPrompt, provider, model })
      });

      setChatMessages((items) => [...items.filter((message) => message.id !== optimisticMessage.id), result.userMessage, result.assistantMessage]);
      await refreshConversations();
    } finally {
      setSending(false);
    }
  }

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
          conversations={conversations}
          projects={projects}
          activeProjectId={activeProjectId}
          activeConversationId={activeConversationId}
          onNewChat={createConversation}
          onCreateProject={createProject}
          onSelectProject={selectProject}
          onSelectConversation={selectConversation}
          onPinConversation={pinConversation}
          onRenameConversation={renameConversation}
          onDeleteConversation={deleteConversation}
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
          conversation={activeConversation}
          messages={chatMessages}
          sending={sending}
          onSend={sendPrompt}
          onNewConversation={createConversation}
          onCancelConversation={cancelConversation}
          onRegenerate={() => {
            const lastUserMessage = [...chatMessages].reverse().find((message) => message.role === "USER");
            if (lastUserMessage) void sendPrompt(lastUserMessage.content);
          }}
          onEditPrompt={(content) => setPrompt(content)}
          onLikeConversation={likeConversation}
          provider={provider}
          model={model}
          onProviderChange={(nextProvider) => {
            setProvider(nextProvider);
            setModel(defaultModels[nextProvider]);
          }}
          onModelChange={setModel}
        />
      </div>
      {authMode && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 px-2 py-2 backdrop-blur-sm sm:px-4">
          <div className="zynex-auth-scroll relative max-h-[calc(100vh-24px)] w-auto max-w-[calc(100vw-16px)] overflow-y-auto rounded-[18px] border border-[#E8EEF7] bg-white p-3 shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100vh-48px)] sm:max-w-[calc(100vw-48px)] sm:rounded-[28px] sm:p-5">
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
                window.setTimeout(() => void refreshProfile(), 150);
                closeAuth();
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

function mergeLocalConversationState(items: Conversation[]) {
  const pinnedIds = new Set(readPinnedConversationIds());
  const projectMap = readProjectConversationMap();
  return sortConversations(items.map((conversation) => ({
    ...conversation,
    pinned: pinnedIds.has(conversation.id),
    projectId: projectMap[conversation.id] || null
  })));
}

function sortConversations(items: Conversation[]) {
  return [...items].sort((first, second) => Number(Boolean(second.pinned)) - Number(Boolean(first.pinned)));
}

function readWorkspaceProjects(): Project[] {
  try {
    return JSON.parse(window.localStorage.getItem("zynex-projects") || "[]");
  } catch {
    return [];
  }
}

function writeWorkspaceProjects(projects: Project[]) {
  window.localStorage.setItem("zynex-projects", JSON.stringify(projects));
}

function readPinnedConversationIds(): string[] {
  try {
    return JSON.parse(window.localStorage.getItem("zynex-pinned-conversations") || "[]");
  } catch {
    return [];
  }
}

function writePinnedConversationIds(ids: string[]) {
  window.localStorage.setItem("zynex-pinned-conversations", JSON.stringify(ids));
}

function readProjectConversationMap(): Record<string, string> {
  try {
    return JSON.parse(window.localStorage.getItem("zynex-project-conversations") || "{}");
  } catch {
    return {};
  }
}

function readLikedChats(): Array<{ id: string; title: string; preview: string; likedAt: string }> {
  try {
    return JSON.parse(window.localStorage.getItem("zynex-liked-chats") || "[]");
  } catch {
    return [];
  }
}
