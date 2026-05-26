"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { AuthFlow } from "@/components/auth/AuthFlow";
import { ChatMain } from "@/components/chat/ChatMain";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ZyNexApiError, getZyNexApiBaseUrl, zynexApi } from "@/lib/api";

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
    if (activeUser) void refreshProjects();
  }, [activeUser?.email]);

  useEffect(() => {
    function updateStreamingMessage(event: Event) {
      const detail = (event as CustomEvent<{ optimisticId: string; content: string }>).detail;
      setChatMessages((items) => items.map((message) => message.id === `${detail.optimisticId}-assistant` ? { ...message, content: detail.content } : message));
    }
    window.addEventListener("zynex-stream-token", updateStreamingMessage);
    return () => window.removeEventListener("zynex-stream-token", updateStreamingMessage);
  }, []);

  async function refreshConversations() {
    try {
      const items = await zynexApi<Conversation[]>("/api/v1/conversations/ZyNexAPI01ConversationsList");
      setConversations(sortConversations(items));
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

  async function refreshProjects() {
    try {
      setProjects(await zynexApi<Project[]>("/api/v1/conversations/ZyNexAPI01Projects"));
    } catch {
      setProjects([]);
    }
  }

  async function createConversation() {
    if (!activeUser) {
      openAuth("login");
      return;
    }
    const conversation = await zynexApi<Conversation>("/api/v1/conversations/ZyNexAPI01ConversationsCreate", {
      method: "POST",
      body: JSON.stringify({ title: "New conversation", provider, model, projectId: activeProjectId })
    });
    setConversations((items) => sortConversations([conversation, ...items]));
    setActiveConversationId(conversation.id);
    setChatMessages([]);
  }

  async function createProject(name: string) {
    const project = await zynexApi<Project>("/api/v1/conversations/ZyNexAPI01Projects", {
      method: "POST",
      body: JSON.stringify({ name })
    });
    setProjects((items) => [project, ...items]);
    setActiveProjectId(project.id);
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

  async function pinConversation(conversationId: string) {
    const updated = await zynexApi<Conversation>(`/api/v1/conversations/ZyNexAPI01Conversations/${conversationId}/Pin`, { method: "PATCH" });
    setConversations((items) => sortConversations(items.map((conversation) => conversation.id === conversationId ? { ...conversation, pinned: updated.pinned } : conversation)));
  }

  async function likeConversation(item: { id: string; title: string; preview: string }) {
    await zynexApi("/api/v1/conversations/ZyNexAPI01LikedChats", {
      method: "POST",
      body: JSON.stringify({ conversationId: item.id, title: item.title, preview: item.preview })
    });
  }

  async function badResponseFeedback(item: { id: string; content: string }) {
    await zynexApi("/api/v1/conversations/ZyNexAPI01ResponseFeedback", {
      method: "POST",
      body: JSON.stringify({ conversationId: item.id, content: item.content, type: "bad" })
    });
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
          body: JSON.stringify({ title: nextPrompt.slice(0, 58), provider, model, projectId: activeProjectId })
        });
        conversationId = conversation.id;
        setActiveConversationId(conversation.id);
        setConversations((items) => sortConversations([conversation, ...items]));
      }

      const optimisticMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "USER",
        content: nextPrompt,
        createdAt: new Date().toISOString()
      };
      setChatMessages((items) => [...items, optimisticMessage]);
      const optimisticAssistant: ChatMessage = {
        id: `${optimisticMessage.id}-assistant`,
        role: "ASSISTANT",
        content: "",
        createdAt: new Date().toISOString()
      };
      setChatMessages((items) => [...items, optimisticAssistant]);

      const result = await streamChatMessage(conversationId, nextPrompt, provider, model, optimisticMessage);
      setChatMessages((items) => [...items.filter((message) => !message.id.startsWith("local-")), result.userMessage, result.assistantMessage]);
      await refreshConversations();
    } catch (error) {
      if (isProviderKeyError(error)) {
        toast.error("Your API key is expired or exhausted.", {
          description: "Regenerate the provider key, update it in Dashboard > API Keys, and continue working.",
          action: {
            label: "Update key",
            onClick: () => {
              window.location.href = "/dashboard?zx=api-keys";
            }
          }
        });
      } else {
        toast.error("Code: CHAT001", { description: `Message: ${error instanceof Error ? error.message : "Unable to send message."}` });
      }
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
          onBadResponse={badResponseFeedback}
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

function sortConversations(items: Conversation[]) {
  return [...items].sort((first, second) => Number(Boolean(second.pinned)) - Number(Boolean(first.pinned)));
}

async function streamChatMessage(conversationId: string, message: string, provider: ProviderName, model: string, optimisticMessage: ChatMessage) {
  const response = await fetch(`${getZyNexApiBaseUrl()}/api/v1/chat/ZyNexAPI01ChatConversations/${conversationId}/MessagesStream`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, provider, model, stream: true })
  });

  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => null);
    throw new ZyNexApiError(payload?.error?.message || "Unable to stream response.", payload?.error?.code || "LLM001", payload?.error?.details || {});
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let assistantDraft = "";
  let finalResult: { userMessage: ChatMessage; assistantMessage: ChatMessage } | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventBlock of events) {
      const event = parseSseEvent(eventBlock);
      if (event.event === "token") {
        assistantDraft += event.data.token || "";
        window.dispatchEvent(new CustomEvent("zynex-stream-token", { detail: { optimisticId: optimisticMessage.id, content: assistantDraft } }));
      }
      if (event.event === "done") finalResult = event.data;
      if (event.event === "error") throw new ZyNexApiError(event.data.message || "Streaming failed.", event.data.code || "LLM001", {});
    }
  }

  if (!finalResult) throw new ZyNexApiError("Streaming response did not complete.", "LLM001", {});
  return finalResult;
}

function parseSseEvent(block: string) {
  const event = block.split("\n").find((line) => line.startsWith("event:"))?.replace("event:", "").trim() || "message";
  const dataLine = block.split("\n").find((line) => line.startsWith("data:"))?.replace("data:", "").trim() || "{}";
  return { event, data: JSON.parse(dataLine) };
}

function isProviderKeyError(error: unknown) {
  if (!(error instanceof ZyNexApiError)) return false;
  const message = error.message.toLowerCase();
  return error.code.startsWith("LLM") || message.includes("api key") || message.includes("quota") || message.includes("credit") || message.includes("rate limit") || message.includes("insufficient");
}
