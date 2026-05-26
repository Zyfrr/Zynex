"use client";

import Link from "next/link";
import { Check, Clipboard, Download, Eye, FileText, Mail, Menu, Mic, Paperclip, Pencil, RefreshCcw, Search, Send, Share2, Sparkles, Square, Table2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  onLikeConversation?: (conversation: { id: string; title: string; preview: string }) => void;
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
  onLikeConversation,
  provider,
  model,
  onProviderChange,
  onModelChange
}: ChatMainProps) {
  const hasMessages = messages.length > 0;
  const conversationCancelled = conversation?.status === "CANCELLED";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; size: number }>>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const tableCount = countMarkdownTables(messages);

  useEffect(() => {
    function closeExportMenu(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }

    document.addEventListener("mousedown", closeExportMenu);
    return () => document.removeEventListener("mousedown", closeExportMenu);
  }, []);

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
          {hasMessages && (
            <div ref={exportMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((value) => !value)}
                className="flex h-9 items-center gap-2 rounded-full border border-[#E8EEF7] bg-white px-3 font-body text-xs font-semibold text-[#4C596C] hover:border-[#4F46E5] hover:text-[#4F46E5] sm:text-sm"
              >
                <Download size={15} />
                Export
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-[#E8EEF7] bg-white p-2 text-left shadow-2xl shadow-slate-900/12">
                  <ExportAction
                    icon={<FileText size={16} />}
                    label="Download Word"
                    subtext="Conversation transcript as .doc"
                    onClick={() => {
                      exportConversationAsWord(messages, conversation?.title || "zynex-conversation");
                      setExportOpen(false);
                    }}
                  />
                  <ExportAction
                    icon={<FileText size={16} />}
                    label="Download PDF"
                    subtext="Open print view and save as PDF"
                    onClick={() => {
                      exportConversationAsPdf(messages, conversation?.title || "zynex-conversation");
                      setExportOpen(false);
                    }}
                  />
                  <ExportAction
                    icon={<Table2 size={16} />}
                    label={tableCount > 0 ? "Export tables CSV" : "Export transcript CSV"}
                    subtext={tableCount > 0 ? `${tableCount} table${tableCount === 1 ? "" : "s"} for Sheets or Excel` : "Rows for Sheets or Excel"}
                    onClick={() => {
                      exportConversationAsCsv(messages, conversation?.title || "zynex-conversation");
                      setExportOpen(false);
                    }}
                  />
                  <ExportAction
                    icon={<Table2 size={16} />}
                    label="Download Excel"
                    subtext="Spreadsheet-compatible .xls"
                    onClick={() => {
                      exportConversationAsExcel(messages, conversation?.title || "zynex-conversation");
                      setExportOpen(false);
                    }}
                  />
                </div>
              )}
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
              {messages.map((message, messageIndex) => (
                <div key={message.id} className={`flex flex-col ${message.role === "USER" ? "items-end" : "items-start"}`}>
                  <div className={`${message.role === "USER" ? "max-w-[86%] text-right" : "w-full max-w-full text-left"}`}>
                    <div
                      className={`w-full rounded-2xl px-4 py-3 font-body text-sm leading-6 shadow-sm ${
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
                          <MessageAction label="Download response" onClick={() => exportSingleMessageAsWord(message, conversation?.title || "zynex-response")}>
                            <Download size={14} />
                          </MessageAction>
                          <MessageAction label="Share">
                            <Share2 size={14} />
                          </MessageAction>
                          <MessageAction
                            label="Good response"
                            onClick={() => onLikeConversation?.({
                              id: conversation?.id || message.id,
                              title: conversation?.title || "Untitled conversation",
                              preview: message.content.slice(0, 180)
                            })}
                          >
                            <ThumbsUp size={14} />
                          </MessageAction>
                          <MessageAction label="Bad response">
                            <ThumbsDown size={14} />
                          </MessageAction>
                        </>
                      )}
                    </div>
                    {message.role === "ASSISTANT" && responseVersionLabel(messages, messageIndex) && (
                      <p className="mt-1.5 font-body text-[11px] font-semibold text-[#8A94A6]">
                        {responseVersionLabel(messages, messageIndex)}
                      </p>
                    )}
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

function ExportAction({ icon, label, subtext, onClick }: { icon: React.ReactNode; label: string; subtext: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F3F5FA]">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#E8EEF7] bg-[#F8FAFC] text-[#4C596C]">{icon}</span>
      <span>
        <span className="block font-body text-sm font-semibold text-[#111827]">{label}</span>
        <span className="mt-0.5 block font-body text-xs font-medium text-[#6B7280]">{subtext}</span>
      </span>
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const canPreview = isHtmlBlock(language, draft);
  return (
    <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#0F172A] text-left">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#111827] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
          <span className="ml-2 font-body text-xs font-semibold text-slate-300">{language || "code"}</span>
        </div>
        <div className="flex items-center gap-1">
          {canPreview && (
            <button type="button" onClick={() => setPreviewOpen((value) => !value)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
              <Eye size={13} />
              Preview
            </button>
          )}
          <button type="button" onClick={() => setEditing(!editing)} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
            Edit
          </button>
          <button type="button" onClick={() => onCopy(id, draft)} className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-white/10">
            {copiedId === id ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {editing ? (
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="block min-h-48 w-full min-w-0 resize-y bg-[#020617] p-4 font-mono text-xs leading-6 text-slate-100 outline-none" />
      ) : (
        <pre className="overflow-x-auto bg-[#1E1E1E] p-4 text-xs leading-6 text-slate-100"><code>{highlightCode(draft, language)}</code></pre>
      )}
      {canPreview && previewOpen && (
        <div className="border-t border-white/10 bg-[#F8FAFC] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-body text-xs font-semibold text-[#4C596C]">Workspace preview</span>
            <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg px-2 py-1 font-body text-xs font-semibold text-[#6B7280] hover:bg-[#E8EEF7]">
              Close
            </button>
          </div>
          <iframe title="HTML preview" sandbox="allow-scripts" srcDoc={draft} className="h-80 w-full rounded-lg border border-[#DDE5F0] bg-white" />
        </div>
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

function highlightCode(code: string, language: string) {
  const keywords = new Set([
    "async", "await", "break", "case", "catch", "class", "const", "continue", "CREATE", "DELETE", "def", "else", "export", "extends",
    "false", "for", "FROM", "function", "if", "implements", "import", "in", "INSERT", "interface", "JOIN", "lambda", "let", "new",
    "null", "or", "private", "protected", "public", "return", "SELECT", "static", "TABLE", "throw", "true", "try", "type", "undefined",
    "UPDATE", "var", "void", "WHERE", "while"
  ]);
  const tokenPattern = /(\/\/.*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b[A-Z_]{3,}\b|\b[A-Za-z_$][\w$]*\b|\b\d+(?:\.\d+)?\b|<\/?[A-Za-z][^>\s]*|[{}()[\].,;:+\-*/%=<>!&|?]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(code))) {
    if (match.index > lastIndex) {
      nodes.push(code.slice(lastIndex, match.index));
    }

    const token = match[0];
    nodes.push(
      <span key={`${token}-${match.index}`} className={tokenClassName(token, keywords, language)}>
        {token}
      </span>
    );
    lastIndex = tokenPattern.lastIndex;
  }

  if (lastIndex < code.length) {
    nodes.push(code.slice(lastIndex));
  }

  return nodes;
}

function tokenClassName(token: string, keywords: Set<string>, language: string) {
  if (/^(\/\/|\/\*|<!--)/.test(token)) return "text-[#6A9955]";
  if (/^["'`]/.test(token)) return "text-[#CE9178]";
  if (/^\d/.test(token)) return "text-[#B5CEA8]";
  if (keywords.has(token)) return "text-[#569CD6]";
  if (/^<\/?[A-Za-z]/.test(token)) return "text-[#569CD6]";
  if (language.toLowerCase().includes("json") && /^[$A-Za-z_][\w$]*$/.test(token)) return "text-[#9CDCFE]";
  if (/^[A-Z_]{3,}$/.test(token)) return "text-[#C586C0]";
  if (/^[A-Za-z_$][\w$]*$/.test(token)) return "text-[#DCDCAA]";
  return "text-[#D4D4D4]";
}

function isHtmlBlock(language: string, code: string) {
  const normalized = language.toLowerCase();
  return normalized === "html" || normalized === "htm" || /^\s*(<!doctype html>|<html|<section|<div|<main|<body)/i.test(code);
}

function exportConversationAsWord(messages: ChatMainProps["messages"], title: string) {
  const html = buildConversationHtml(messages || [], title);
  downloadBlob(`${safeFileName(title)}.doc`, new Blob([html], { type: "application/msword;charset=utf-8" }));
}

function exportSingleMessageAsWord(message: NonNullable<ChatMainProps["messages"]>[number], title: string) {
  downloadBlob(`${safeFileName(title)}-response.doc`, new Blob([buildConversationHtml([message], `${title} response`)], { type: "application/msword;charset=utf-8" }));
}

function exportConversationAsPdf(messages: ChatMainProps["messages"], title: string) {
  const html = buildConversationHtml(messages || [], title);
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
}

function exportConversationAsCsv(messages: ChatMainProps["messages"], title: string) {
  const tables = extractMarkdownTables(messages || []);
  const rows = tables.length > 0
    ? tables.flatMap((table, index) => [["Table", `${index + 1}`], table.headers, ...table.rows, []])
    : [["Role", "Created at", "Content"], ...(messages || []).map((message) => [message.role, message.createdAt, message.content])];
  downloadBlob(`${safeFileName(title)}.csv`, new Blob([`\ufeff${toCsv(rows)}`], { type: "text/csv;charset=utf-8" }));
}

function exportConversationAsExcel(messages: ChatMainProps["messages"], title: string) {
  const tables = extractMarkdownTables(messages || []);
  const body = tables.length > 0
    ? tables.map((table, index) => `<h2>Table ${index + 1}</h2>${htmlTable(table.headers, table.rows)}`).join("")
    : htmlTable(["Role", "Created at", "Content"], (messages || []).map((message) => [message.role, message.createdAt, message.content]));
  const workbook = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body>${body}</body></html>`;
  downloadBlob(`${safeFileName(title)}.xls`, new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }));
}

function buildConversationHtml(messages: NonNullable<ChatMainProps["messages"]>, title: string) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; padding: 32px; line-height: 1.55; }
    h1 { margin: 0 0 6px; font-size: 28px; }
    .meta { color: #6B7280; margin-bottom: 28px; }
    .message { border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px 16px; margin: 14px 0; }
    .role { font-size: 12px; font-weight: 700; letter-spacing: .04em; color: #4F46E5; text-transform: uppercase; }
    pre { white-space: pre-wrap; background: #F3F4F6; padding: 12px; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">Exported from ZyNex on ${new Date().toLocaleString()}</div>
  ${messages.map((message) => `<div class="message"><div class="role">${escapeHtml(message.role)}</div><pre>${escapeHtml(message.content)}</pre></div>`).join("")}
</body>
</html>`;
}

function extractMarkdownTables(messages: NonNullable<ChatMainProps["messages"]>) {
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  for (const message of messages) {
    const lines = message.content.split(/\r?\n/);
    for (let index = 0; index < lines.length - 1; index += 1) {
      if (isMarkdownTableRow(lines[index]) && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1])) {
        const headers = splitMarkdownTableRow(lines[index]);
        const rows: string[][] = [];
        index += 2;
        while (index < lines.length && isMarkdownTableRow(lines[index])) {
          rows.push(splitMarkdownTableRow(lines[index]));
          index += 1;
        }
        if (headers.length && rows.length) tables.push({ headers, rows });
      }
    }
  }
  return tables;
}

function countMarkdownTables(messages: ChatMainProps["messages"]) {
  return extractMarkdownTables(messages || []).length;
}

function isMarkdownTableRow(line: string) {
  return line.includes("|") && splitMarkdownTableRow(line).length > 1;
}

function splitMarkdownTableRow(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function htmlTable(headers: string[], rows: string[][]) {
  return `<table border="1" cellspacing="0" cellpadding="8"><thead><tr>${headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFileName(value: string) {
  return (value || "zynex-conversation").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 72) || "zynex-conversation";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character] || character));
}

function responseVersionLabel(messages: NonNullable<ChatMainProps["messages"]>, assistantIndex: number) {
  const prompt = findPreviousUserPrompt(messages, assistantIndex);
  if (!prompt) return "";

  let total = 0;
  let current = 0;
  for (let index = 0; index < messages.length; index += 1) {
    if (messages[index].role === "ASSISTANT" && findPreviousUserPrompt(messages, index) === prompt) {
      total += 1;
      if (index <= assistantIndex) current += 1;
    }
  }

  return total > 1 ? `Response ${current} of ${total}` : "";
}

function findPreviousUserPrompt(messages: NonNullable<ChatMainProps["messages"]>, fromIndex: number) {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    if (messages[index].role === "USER") return messages[index].content.trim();
  }
  return "";
}
