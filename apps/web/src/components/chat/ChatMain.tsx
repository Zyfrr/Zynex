"use client";

import Link from "next/link";
import { Check, Clipboard, Mail, Menu, Mic, Paperclip, Pencil, RefreshCcw, Search, Send, Share2, Sparkles, Square, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useRef, useState } from "react";
import { suggestions } from "@/components/chat/chatData";

type ProviderName = "Claude" | "OpenAI" | "Gemini" | "OpenRouter" | "Groq";

type ChatMainProps = {
  onOpenSidebar: () => void;
  temporaryChat: boolean;
  setTemporaryChat: (value: boolean) => void;
  attachOpen: boolean;
  setAttachOpen: (value: boolean) => void;
  recording: boolean;
  setRecording: (value: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  user?: { name?: string | null; email?: string | null; image?: string | null } | null;
  authenticated: boolean;
  onLoginClick: () => void;
  onSignupClick: () => void;
  conversation?: {
    id: string;
    title?: string | null;
    status: "ACTIVE" | "CANCELLED" | "ARCHIVED";
    provider: string;
    model: string;
  } | null;
  messages?: Array<{ id: string; role: "USER" | "ASSISTANT" | "SYSTEM"; content: string; createdAt: string }>;
  sending?: boolean;
  onSend?: () => void;
  onNewConversation?: () => void;
  onCancelConversation?: () => void;
  onRegenerate?: () => void;
  onEditPrompt?: (content: string) => void;
  provider: ProviderName;
  model: string;
  onProviderChange: (provider: ProviderName) => void;
  onModelChange: (model: string) => void;
};

export function ChatMain({
  onOpenSidebar,
  temporaryChat,
  setTemporaryChat,
  attachOpen,
  setAttachOpen,
  recording,
  setRecording,
  prompt,
  setPrompt,
  authenticated,
  onLoginClick,
  onSignupClick,
  conversation,
  messages = [],
  sending = false,
  onSend,
  onNewConversation,
  onCancelConversation,
  onRegenerate,
  onEditPrompt,
  provider,
  model,
  onProviderChange,
  onModelChange
}: ChatMainProps) {
  const hasMessages = messages.length > 0;
  const conversationCancelled = conversation?.status === "CANCELLED";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; size: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function copyText(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1400);
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex min-h-[58px] shrink-0 items-center justify-between gap-3 border-b border-[#E8EEF7] bg-white/90 px-3 py-2 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#4C596C]">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={onOpenSidebar}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E8EEF7] bg-white text-[#4C596C] md:hidden"
          >
            <Menu size={18} />
          </button>
          <Sparkles size={17} className="text-[#4F46E5]" />
          <span className="truncate">ZyNex Chat</span>
          {conversation && (
            <span className="hidden rounded-full bg-[#F3F5FA] px-2.5 py-1 font-body text-xs text-[#6B7280] sm:inline">
              {conversation.provider} / {conversation.model}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          {authenticated && (
            <div className="hidden items-center gap-2 rounded-full border border-[#E8EEF7] bg-white px-2 py-1 md:flex">
              <select
                value={provider}
                onChange={(event) => onProviderChange(event.target.value as ProviderName)}
                className="rounded-full bg-[#F8FAFC] px-2 py-1 font-body text-xs font-semibold text-[#253248] outline-none"
                aria-label="LLM provider"
              >
                <option value="Groq">Groq</option>
                <option value="OpenRouter">OpenRouter</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Claude">Claude</option>
                <option value="Gemini">Gemini</option>
              </select>
              <input
                value={model}
                onChange={(event) => onModelChange(event.target.value)}
                aria-label="LLM model"
                className="h-7 w-32 rounded-full bg-[#F3F5FA] px-2 font-body text-xs font-semibold text-[#4C596C] outline-none"
              />
            </div>
          )}
          {!authenticated && (
            <>
              <button
                type="button"
                onClick={onLoginClick}
                className="h-9 rounded-full border border-[#E8EEF7] bg-white px-3 font-body text-xs font-semibold text-[#253248] hover:border-[#4F46E5] hover:text-[#4F46E5] sm:px-4 sm:text-sm"
              >
                Login
              </button>
              <button
                type="button"
                onClick={onSignupClick}
                className="h-9 rounded-full bg-[#111827] px-3 font-body text-xs font-semibold text-white hover:bg-[#242A33] sm:px-4 sm:text-sm"
              >
                Sign up for free
              </button>
            </>
          )}
          <div className="group relative">
            <button
              type="button"
              onClick={() => setTemporaryChat(!temporaryChat)}
              className={`flex h-9 items-center gap-2 rounded-full border px-2.5 font-body text-xs font-semibold transition sm:px-3 sm:text-sm ${
                temporaryChat
                  ? "border-[#4F46E5] bg-indigo-50 text-[#4F46E5]"
                  : "border-[#E8EEF7] bg-white text-[#4C596C] hover:border-[#D7DFEB]"
              }`}
            >
              <Sparkles size={15} />
              <span className="hidden min-[420px]:inline">Temporary</span>
            </button>
            <div className="pointer-events-none absolute right-0 top-11 z-40 w-64 translate-y-1 rounded-xl border border-[#E8EEF7] bg-[#111827] p-3 text-xs leading-5 text-white opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
              Temporary chat keeps the current conversation out of saved history and logging previews.
            </div>
          </div>
          {authenticated && (
            <button
              type="button"
              onClick={onNewConversation}
              className="h-9 rounded-full border border-[#E8EEF7] bg-white px-3 font-body text-xs font-semibold text-[#4C596C] hover:border-[#4F46E5] hover:text-[#4F46E5] sm:text-sm"
            >
              New
            </button>
          )}
          {authenticated && conversation && conversation.status === "ACTIVE" && (
            <button
              type="button"
              onClick={onCancelConversation}
              className="flex h-9 items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 font-body text-xs font-semibold text-red-600 hover:border-red-200 sm:text-sm"
            >
              <Square size={13} />
              Cancel
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className={`min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 ${hasMessages ? "" : "flex items-center justify-center"}`}>
          {hasMessages ? (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex flex-col ${message.role === "USER" ? "items-end" : "items-start"}`}>
                  <div className={`max-w-[86%] ${message.role === "USER" ? "text-right" : "text-left"}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 font-body text-sm leading-6 shadow-sm ${
                        message.role === "USER"
                          ? "bg-[#111827] text-white"
                          : "border border-[#E8EEF7] bg-white text-[#253248]"
                      }`}
                    >
                      {message.role === "ASSISTANT" ? (
                        <RichMessage content={message.content} onCopy={copyText} copiedId={copiedId} />
                      ) : (
                        <p className="whitespace-pre-wrap text-left">{message.content}</p>
                      )}
                    </div>
                    <div className={`mt-2 flex items-center gap-1.5 ${message.role === "USER" ? "justify-end" : "justify-start"}`}>
                      <MessageAction label="Copy" onClick={() => copyText(message.id, message.content)}>
                        {copiedId === message.id ? <Check size={14} /> : <Clipboard size={14} />}
                      </MessageAction>
                      {message.role === "USER" ? (
                        <MessageAction label="Edit prompt" onClick={() => onEditPrompt?.(message.content)}>
                          <Pencil size={14} />
                        </MessageAction>
                      ) : (
                        <>
                          <MessageAction label="Regenerate" onClick={onRegenerate}>
                            <RefreshCcw size={14} />
                          </MessageAction>
                          <MessageAction label="Share">
                            <Share2 size={14} />
                          </MessageAction>
                          <MessageAction label="Good response">
                            <ThumbsUp size={14} />
                          </MessageAction>
                          <MessageAction label="Bad response">
                            <ThumbsDown size={14} />
                          </MessageAction>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-[#E8EEF7] bg-white px-4 py-3 text-[#4C596C] shadow-sm">
                    <span className="inline-flex items-center gap-2 font-body text-sm font-semibold">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#4F46E5]" />
                      Logging inference...
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-3xl text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[#E8EEF7] bg-white shadow-sm sm:h-14 sm:w-14">
                <img src="/assets/zynex-logos/zynex_favicon.svg" alt="" className="h-8 w-8 rounded-full sm:h-9 sm:w-9" />
              </div>
              <h1 className="mt-5 font-display text-[34px] font-semibold leading-[0.95] tracking-normal text-[#111827] sm:text-[44px] lg:text-[52px]">
                How can ZyNex help today?
              </h1>
              <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-6 text-[#5D6A7C] sm:text-[15px] sm:leading-7">
                Ask a question, practice a roleplay, compare providers, or inspect inference behavior.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPrompt(item)}
                    className="rounded-2xl border border-[#E8EEF7] bg-white p-4 text-left font-body text-sm font-semibold text-[#253248] shadow-sm transition hover:border-[#4F46E5] hover:text-[#4F46E5]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="shrink-0 bg-[#F7F8FB] px-3 pb-3 sm:px-5 sm:pb-4">
          <div className="relative mx-auto max-w-3xl rounded-[20px] border border-[#DDE5F0] bg-white p-2.5 shadow-[0_18px_60px_rgba(15,36,66,0.08)] sm:rounded-[24px] sm:p-3">
            {attachOpen && (
              <div className="absolute bottom-[96px] left-2 right-2 z-30 rounded-2xl border border-[#E8EEF7] bg-white p-2 shadow-2xl shadow-slate-900/12 sm:left-3 sm:right-auto sm:w-64">
                <AttachAction label="Upload file" subtext="PDF, CSV, DOCX, TXT" onClick={() => fileInputRef.current?.click()} />
                <AttachAction label="Connect source" subtext="Knowledge base or URL" />
                <AttachAction label="Add screenshot" subtext="Image context for the prompt" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files || []).map((file) => ({ name: file.name, size: file.size }));
                setAttachedFiles((items) => [...items, ...files]);
                setAttachOpen(false);
                event.currentTarget.value = "";
              }}
            />
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 px-3 pb-2">
                {attachedFiles.map((file) => (
                  <span key={`${file.name}-${file.size}`} className="inline-flex items-center gap-2 rounded-full border border-[#E8EEF7] bg-[#F8FAFC] px-3 py-1.5 font-body text-xs font-semibold text-[#4C596C]">
                    <Paperclip size={13} />
                    {file.name}
                    <button type="button" onClick={() => setAttachedFiles((items) => items.filter((item) => item !== file))} className="text-[#8A94A6] hover:text-red-600">
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSend?.();
                }
              }}
              placeholder="Message ZyNex..."
              rows={2}
              disabled={conversationCancelled || sending}
              className="min-h-[76px] w-full resize-none bg-transparent px-3 py-2 font-body text-sm leading-6 text-[#111827] outline-none placeholder:text-[#8A94A6] sm:min-h-[82px] sm:text-[15px]"
            />
            <div className="flex items-center justify-between gap-2 px-1 pt-2">
              <div className="flex items-center gap-1.5">
                <IconButton label="Attach files" active={attachOpen} onClick={() => setAttachOpen(!attachOpen)}>
                  <Paperclip size={18} />
                </IconButton>
                <IconButton label="Search context">
                  <Search size={18} />
                </IconButton>
              </div>

              <div className="flex items-center gap-2">
                {recording && (
                  <div className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-2">
                    {[0, 1, 2, 3].map((bar) => (
                      <span
                        key={bar}
                        className="h-4 w-1 animate-pulse rounded-full bg-red-500"
                        style={{ animationDelay: `${bar * 120}ms` }}
                      />
                    ))}
                  </div>
                )}
                <IconButton label="Voice input" active={recording} onClick={() => setRecording(!recording)}>
                  {recording ? <X size={18} /> : <Mic size={18} />}
                </IconButton>
                <button
                  type="button"
                  disabled={!prompt.trim() || conversationCancelled || sending}
                  aria-label="Send message"
                  onClick={onSend}
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition hover:bg-[#242A33] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/45 border-t-white" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-3 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center font-body text-[11px] font-medium text-[#6B7280] sm:gap-x-4 sm:text-[12px]">
            <span>© 2026 ZyNex by Zyfrr</span>
            <Link href="/Privacy" className="hover:text-[#4F46E5]">
              Privacy Policy
            </Link>
            <Link href="/Terms" className="hover:text-[#4F46E5]">
              Terms of Use
            </Link>
            <span>Service: LLM inference observability</span>
            <a href="mailto:support@zyfrr.com" className="inline-flex items-center gap-1 hover:text-[#4F46E5]">
              <Mail size={13} />
              support@zyfrr.com
            </a>
          </div>
        </footer>
      </div>
    </section>
  );
}

function IconButton({
  children,
  label,
  active = false,
  onClick
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-full border transition ${
        active
          ? "border-[#4F46E5] bg-indigo-50 text-[#4F46E5]"
          : "border-[#E8EEF7] bg-white text-[#4C596C] hover:border-[#D7DFEB] hover:text-[#4F46E5]"
      }`}
    >
      {children}
    </button>
  );
}

function AttachAction({ label, subtext, onClick }: { label: string; subtext: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#F3F5FA]">
      <span className="block font-body text-sm font-semibold text-[#111827]">{label}</span>
      <span className="mt-0.5 block font-body text-xs font-medium text-[#6B7280]">{subtext}</span>
    </button>
  );
}

function RichMessage({ content, onCopy, copiedId }: { content: string; onCopy: (id: string, value: string) => void; copiedId: string | null }) {
  const parts = parseCodeBlocks(content);
  return (
    <div className="space-y-3 text-left">
      {parts.map((part, index) => part.type === "code" ? (
        <CodeBlock key={index} id={`code-${index}-${part.language}`} language={part.language} code={part.value} onCopy={onCopy} copiedId={copiedId} />
      ) : (
        <p key={index} className="whitespace-pre-wrap">{part.value}</p>
      ))}
    </div>
  );
}

function CodeBlock({ id, language, code, onCopy, copiedId }: { id: string; language: string; code: string; onCopy: (id: string, value: string) => void; copiedId: string | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(code);
  return (
    <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#0F172A] text-left">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111827] px-3 py-2">
        <span className="font-body text-xs font-semibold text-slate-300">{language || "code"}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setEditing(!editing)} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
            Edit
          </button>
          <button type="button" onClick={() => onCopy(id, draft)} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
            {copiedId === id ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {editing ? (
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="min-h-48 w-full resize-y bg-[#020617] p-4 font-mono text-xs leading-6 text-slate-100 outline-none" />
      ) : (
        <pre className="overflow-x-auto p-4 text-xs leading-6 text-slate-100"><code>{draft}</code></pre>
      )}
    </div>
  );
}

function MessageAction({ children, label, onClick }: { children: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="grid h-7 w-7 place-items-center rounded-full border border-[#E8EEF7] bg-white text-[#6B7280] transition hover:border-[#D7DFEB] hover:text-[#4F46E5]">
      {children}
    </button>
  );
}

function parseCodeBlocks(content: string) {
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: Array<{ type: "text" | "code"; value: string; language: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content))) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index).trim(), language: "" });
    }
    parts.push({ type: "code", language: match[1] || "text", value: match[2]?.trimEnd() || "" });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex).trim(), language: "" });
  }

  return parts.filter((part) => part.value);
}
