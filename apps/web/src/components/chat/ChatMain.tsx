"use client";

import Link from "next/link";
import { Check, Clipboard, Download, Eye, FileText, Mail, Menu, Mic, Paperclip, Pencil, RefreshCcw, Send, Share2, Sparkles, Square, Table2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { suggestions } from "@/components/chat/chatData";

type ProviderName = "Claude" | "OpenAI" | "Gemini" | "OpenRouter" | "Groq";
type ChatAttachment = { name: string; type?: string; size: number; textPreview?: string };

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechRecognitionResultListLike = {
  length: number;
  item(index: number): SpeechRecognitionResultLike;
  [index: number]: SpeechRecognitionResultLike;
};
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  item(index: number): { transcript: string };
  [index: number]: { transcript: string };
};
type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};
type SpeechRecognitionInstance = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onsoundstart: (() => void) | null;
  onsoundend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

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
  onSend?: (attachments?: ChatAttachment[]) => void;
  onNewConversation?: () => void;
  onCancelConversation?: () => void;
  onRegenerate?: () => void;
  onEditPrompt?: (content: string) => void;
  onLikeConversation?: (conversation: { id: string; title: string; preview: string }) => void;
  onBadResponse?: (conversation: { id: string; content: string }) => void;
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
  onBadResponse,
  provider,
  model,
  onProviderChange,
  onModelChange
}: ChatMainProps) {
  const hasMessages = messages.length > 0;
  const conversationCancelled = conversation?.status === "CANCELLED";
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<ChatAttachment[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "analyzing" | "unsupported">("idle");
  const [voiceInterim, setVoiceInterim] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const recordingActiveRef = useRef(false);
  const promptRef = useRef(prompt);
  const tableCount = countMarkdownTables(messages);

  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);

  useEffect(() => {
    function closeExportMenu(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }

    document.addEventListener("mousedown", closeExportMenu);
    return () => document.removeEventListener("mousedown", closeExportMenu);
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setVoiceSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    return () => {
      recordingActiveRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!hasMessages) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [hasMessages, messages, sending]);

  async function copyText(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1400);
  }

  function startVoiceInput() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceState("unsupported");
      window.setTimeout(() => setVoiceState("idle"), 3200);
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    recordingActiveRef.current = true;
    setVoiceSeconds(0);
    setVoiceInterim("");
    setVoiceState("listening");
    setRecording(true);

    recognition.onstart = () => setVoiceState("listening");
    recognition.onspeechstart = () => setVoiceState("analyzing");
    recognition.onsoundstart = () => setVoiceState("analyzing");
    recognition.onspeechend = () => setVoiceState("listening");
    recognition.onsoundend = () => setVoiceState("listening");
    recognition.onerror = () => {
      setVoiceState("listening");
    };
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript || "";
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText.trim()) {
        const currentPrompt = promptRef.current;
        const nextPrompt = `${currentPrompt}${currentPrompt.trim() ? " " : ""}${finalText.trim()}`.trim();
        promptRef.current = nextPrompt;
        setPrompt(nextPrompt);
      }
      setVoiceInterim(interimText.trim());
    };
    recognition.onend = () => {
      if (recordingActiveRef.current) {
        try {
          recognition.start();
        } catch {
          setVoiceState("listening");
        }
      }
    };

    try {
      recognition.start();
    } catch {
      recordingActiveRef.current = false;
      setRecording(false);
      setVoiceState("unsupported");
    }
  }

  function stopVoiceInput() {
    recordingActiveRef.current = false;
    setRecording(false);
    setVoiceState("analyzing");
    setVoiceInterim("");
    recognitionRef.current?.stop();
    window.setTimeout(() => setVoiceState("idle"), 700);
  }

  function toggleVoiceInput() {
    if (recording) {
      stopVoiceInput();
      return;
    }
    startVoiceInput();
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
        <div ref={scrollAreaRef} className={`min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 ${hasMessages ? "" : "flex items-center justify-center"}`}>
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
                          <MessageAction label="Share" onClick={() => shareMessage(message.content, conversation?.title || "ZyNex response")}>
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
                          <MessageAction label="Bad response" onClick={() => onBadResponse?.({ id: conversation?.id || message.id, content: message.content })}>
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
              <div ref={messagesEndRef} />
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
              onChange={async (event) => {
                const files = await Promise.all(Array.from(event.target.files || []).map(readAttachmentPreview));
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
            {(recording || voiceState === "unsupported" || voiceState === "analyzing") && (
              <VoiceRecorderPanel state={voiceState} seconds={voiceSeconds} interim={voiceInterim} />
            )}
            <div className="flex items-end gap-2 px-1 pt-1">
              <IconButton label="Attach files" active={attachOpen} onClick={() => setAttachOpen(!attachOpen)}>
                <Paperclip size={18} />
              </IconButton>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onInput={(event) => setPrompt(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    onSend?.(attachedFiles);
                    setAttachedFiles([]);
                  }
                }}
                placeholder="Message ZyNex..."
                rows={1}
                disabled={conversationCancelled || sending}
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 font-body text-sm leading-5 text-[#111827] outline-none placeholder:text-[#8A94A6] sm:text-[15px]"
              />
              <IconButton label={recording ? "Stop voice input" : "Voice input"} active={recording} onClick={toggleVoiceInput}>
                {recording ? <StopVoiceIcon /> : <Mic size={18} />}
              </IconButton>
              <button
                type="button"
                disabled={!prompt.trim() || conversationCancelled || sending}
                aria-label="Send message"
                onClick={() => {
                  onSend?.(attachedFiles);
                  setAttachedFiles([]);
                }}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#111827] text-white transition hover:bg-[#242A33] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/45 border-t-white" /> : <Send size={18} />}
              </button>
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

function VoiceRecorderPanel({ state, seconds, interim }: { state: "idle" | "listening" | "analyzing" | "unsupported"; seconds: number; interim: string }) {
  const unsupported = state === "unsupported";
  return (
    <div className={`mx-2 mb-2 rounded-2xl border px-3 py-2.5 ${unsupported ? "border-amber-200 bg-amber-50" : "border-[#E8EEF7] bg-[#F8FAFC]"}`}>
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${state === "analyzing" ? "animate-pulse bg-[#4F46E5]" : unsupported ? "bg-amber-500" : "bg-emerald-500"}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="font-body text-xs font-bold uppercase text-[#64748B]">
              {unsupported ? "Speech unavailable" : state === "analyzing" ? "Analyzing speech" : "Listening"}
            </span>
            <span className="font-mono text-xs font-bold text-[#475569]">{formatVoiceTime(seconds)}</span>
          </div>
          {unsupported ? (
            <p className="mt-1 font-body text-xs font-semibold text-amber-700">Speech recognition is not available in this browser. Try Chrome desktop for voice input.</p>
          ) : (
            <div className="mt-2 h-8 overflow-hidden rounded-full border border-[#E8EEF7] bg-white px-3">
              {state === "analyzing" ? <VoiceWaves /> : <VoiceDots />}
            </div>
          )}
          {interim && <p className="mt-2 truncate font-body text-xs font-semibold text-[#4F46E5]">{interim}</p>}
        </div>
      </div>
    </div>
  );
}

function VoiceDots() {
  return (
    <div className="flex h-full min-w-max animate-[voiceTrack_1.2s_linear_infinite] items-center gap-2">
      {Array.from({ length: 42 }).map((_, index) => (
        <span key={index} className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#CBD5E1]" />
      ))}
    </div>
  );
}

function VoiceWaves() {
  return (
    <div className="flex h-full items-center justify-center gap-1.5">
      {[10, 18, 26, 14, 30, 20, 12, 24, 16].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="w-1 animate-[voiceWave_680ms_ease-in-out_infinite] rounded-full bg-[#4F46E5]"
          style={{ height, animationDelay: `${index * 70}ms` }}
        />
      ))}
    </div>
  );
}

function StopVoiceIcon() {
  return (
    <span className="relative grid h-5 w-5 place-items-center rounded-full border-2 border-white/90">
      <span className="absolute h-3 w-3 rounded-full bg-white/25" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-white" />
    </span>
  );
}

function formatVoiceTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
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
  const cleanedContent = sanitizeGeneratedContent(content);
  const parts = parseCodeBlocks(cleanedContent);
  const documentLike = isDocumentLike(cleanedContent);
  const documentSplit = documentLike && parts.length === 1 ? splitDocumentDraft(parts[0].value) : null;
  return (
    <div className="space-y-3 text-left">
      {documentSplit ? (
        <>
          {documentSplit.before && <MarkdownContent content={documentSplit.before} />}
          <EditableDocument content={documentSplit.document} title={documentSplit.title} onCopy={onCopy} copiedId={copiedId} />
          {documentSplit.after && <MarkdownContent content={documentSplit.after} />}
        </>
      ) : parts.map((part, index) => part.type === "code" ? (
        <CodeBlock key={index} id={`code-${index}-${part.language}`} language={part.language} code={part.value} onCopy={onCopy} copiedId={copiedId} />
      ) : documentLike && parts.length === 1 ? (
        <EditableDocument key={index} content={part.value} title="Editable response" onCopy={onCopy} copiedId={copiedId} />
      ) : (
        <MarkdownContent key={index} content={part.value} />
      ))}
    </div>
  );
}

function EditableDocument({ content, title, onCopy, copiedId }: { content: string; title: string; onCopy: (id: string, value: string) => void; copiedId: string | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sanitizeGeneratedContent(content));
  const id = `doc-${safeFileName(content.slice(0, 32))}`;

  useEffect(() => {
    setDraft(sanitizeGeneratedContent(content));
  }, [content]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#DDE5F0] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8EEF7] bg-[#F8FAFC] px-3 py-2">
        <span className="font-body text-xs font-bold uppercase text-[#64748B]">{title}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setEditing((value) => !value)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-body text-xs font-semibold text-[#4C596C] hover:bg-white">
            <Pencil size={13} />
            {editing ? "Preview" : "Edit"}
          </button>
          <button type="button" onClick={() => onCopy(id, draft)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-body text-xs font-semibold text-[#4C596C] hover:bg-white">
            {copiedId === id ? <Check size={13} /> : <Clipboard size={13} />}
            {copiedId === id ? "Copied" : "Copy"}
          </button>
          <button type="button" onClick={() => exportDocumentTextAsWord(draft, title)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-body text-xs font-semibold text-[#4C596C] hover:bg-white">
            <FileText size={13} />
            DOC
          </button>
          <button type="button" onClick={() => exportDocumentTextAsPdf(draft, title)} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 font-body text-xs font-semibold text-[#4C596C] hover:bg-white">
            <Download size={13} />
            PDF
          </button>
        </div>
      </div>
      {editing ? (
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} className="block min-h-72 w-full resize-y bg-white p-4 font-body text-sm leading-7 text-[#111827] outline-none" />
      ) : (
        <div className="p-4 font-body text-sm leading-7 text-[#111827]">
          <MarkdownContent content={draft} />
        </div>
      )}
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return <h3 key={index} className="font-display text-lg font-semibold leading-7 text-[#111827]">{renderInlineMarkdown(block.value)}</h3>;
        }
        if (block.type === "list") {
          return block.ordered ? (
            <ol key={index} className="list-decimal space-y-1 pl-5">{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(item)}</li>)}</ol>
          ) : (
            <ul key={index} className="list-disc space-y-1 pl-5">{block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInlineMarkdown(item)}</li>)}</ul>
          );
        }
        if (block.type === "table") {
          return (
            <div key={index} className="overflow-x-auto rounded-xl border border-[#E8EEF7]">
              <table className="min-w-full border-collapse text-left font-body text-sm">
                <thead className="bg-[#F8FAFC] text-xs uppercase text-[#64748B]">
                  <tr>{block.headers.map((header, cellIndex) => <th key={cellIndex} className="border-b border-[#E8EEF7] px-3 py-2 font-bold">{renderInlineMarkdown(header)}</th>)}</tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-[#EEF2F7]">
                      {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2 align-top">{renderInlineMarkdown(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={index} className="whitespace-pre-wrap">{renderInlineMarkdown(block.value)}</p>;
      })}
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

function sanitizeGeneratedContent(content: string) {
  return normalizeDocumentText(content)
    .replace(/^\s*#{1,6}\s*$/gm, "")
    .replace(/^\s*#{1,6}\s*(?=\n|$)/gm, "")
    .replace(/^\s*[=]{3,}\s*/gm, "")
    .replace(/(^|\n)\s*[+]\s+/g, "$1- ")
    .replace(/\s+#(?=\s|$|\n)/g, "")
    .replace(/(^|\n)(Subject:[^\n]+)\s+(Dear\b)/gi, "$1$2\n\n$3")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type MarkdownBlock =
  | { type: "heading"; value: string }
  | { type: "paragraph"; value: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const normalized = normalizeGeneratedText(content);
  const lines = normalized.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (isMarkdownTableRow(line) && lines[index + 1] && isMarkdownSeparatorRow(lines[index + 1])) {
      const headers = splitMarkdownTableRow(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && isMarkdownTableRow(lines[index])) {
        rows.push(splitMarkdownTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const boldHeading = line.match(/^\*\*([^*]+)\*\*:?$/);
    if (heading || boldHeading) {
      blocks.push({ type: "heading", value: stripMarkdownDecorators((heading?.[2] || boldHeading?.[1] || line).trim()) });
      index += 1;
      continue;
    }

    if (/^(\d+\.\s+|[-*]\s+)/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const items: string[] = [];
      while (index < lines.length) {
        const itemLine = lines[index].trim();
        const itemMatch = itemLine.match(ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/);
        if (!itemMatch) break;
        items.push(itemMatch[1].trim());
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraph: string[] = [line];
    index += 1;
    while (index < lines.length) {
      const nextLine = lines[index].trim();
      if (!nextLine || /^(#{1,4})\s+/.test(nextLine) || /^\*\*([^*]+)\*\*:?$/.test(nextLine) || /^(\d+\.\s+|[-*]\s+)/.test(nextLine)) break;
      if (isMarkdownTableRow(nextLine) && lines[index + 1] && isMarkdownSeparatorRow(lines[index + 1])) break;
      paragraph.push(nextLine);
      index += 1;
    }
    blocks.push({ type: "paragraph", value: paragraph.join(" ") });
  }

  return blocks.length ? blocks : [{ type: "paragraph", value: normalized }];
}

function normalizeGeneratedText(content: string) {
  return sanitizeGeneratedContent(content)
    .replace(/\*\*\s*\*\*/g, "\n")
    .replace(/(\S)(#{1,4}\s+)/g, "$1\n$2")
    .replace(/(\S)(\*\*[^*]+:\*\*)/g, "$1\n$2")
    .replace(/(\S)([-*]\s+[A-Z0-9])/g, "$1\n$2")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function normalizeDocumentText(content: string) {
  if (!isDocumentLikeRaw(content)) return content;
  return content
    .replace(/(Here's\s+a\s+sample[^:\n]*:)\s*/i, "$1\n\n")
    .replace(/(\[[^\]]+\])(?=(The Principal|Dear|Respected|To\b|From\b))/gi, "$1\n")
    .replace(/(The Principal,?)(?=\S)/gi, "$1\n")
    .replace(/(School,?[^.\n]*\.)(?=\S)/gi, "$1\n\n")
    .replace(/(Dear\s+[^,\n]+,)(?=\S)/gi, "$1\n\n")
    .replace(/(Respected\s+Sir\/Madam,?)(?=\S)/gi, "$1\n\n")
    .replace(/(\.)(?=(I am writing|The reason|I will|If there|Thank you|Sincerely|Class:|Note:))/g, "$1\n\n")
    .replace(/(Sincerely,)(?=\S)/gi, "$1\n")
    .replace(/(Class:\s*\[[^\]]+\])(?=\S)/gi, "$1\n")
    .replace(/(Note:)(?=\S)/gi, "$1 ");
}

function renderInlineMarkdown(value: string) {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value))) {
    if (match.index > lastIndex) nodes.push(value.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={`${token}-${match.index}`}>{token.slice(2, -2)}</strong>);
    } else {
      nodes.push(<code key={`${token}-${match.index}`} className="rounded bg-[#F3F5FA] px-1 py-0.5 font-mono text-[0.9em] text-[#334155]">{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < value.length) nodes.push(value.slice(lastIndex));
  return nodes;
}

function stripMarkdownDecorators(value: string) {
  return value.replace(/^\*+|\*+$/g, "").trim();
}

function isMarkdownSeparatorRow(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function isDocumentLike(content: string) {
  return isDocumentLikeRaw(content);
}

function isDocumentLikeRaw(content: string) {
  const normalized = content.toLowerCase();
  return /\b(dear|sincerely|regards|subject:|leave of absence|scorecard|rubric|section\s+\d|template|draft|referral email|attachments:)\b/.test(normalized) || extractMarkdownTables([{ id: "x", role: "ASSISTANT", content, createdAt: "" }]).length > 0;
}

function splitDocumentDraft(content: string) {
  const lines = sanitizeGeneratedContent(content).split(/\r?\n/);
  const startIndex = lines.findIndex((line) => /^(subject:|dear\b|to:|from:|date\b|\[[^\]]*date[^\]]*\]|the principal\b|respected\b|referral email\b|attachments:)/i.test(line.trim()));
  if (startIndex <= 0) {
    return { before: "", document: lines.join("\n").trim(), after: "", title: inferDocumentTitle(content) };
  }

  const before = lines.slice(0, startIndex).join("\n").trim();
  const document = lines.slice(startIndex).join("\n").trim();
  return { before, document, after: "", title: inferDocumentTitle(document) };
}

function inferDocumentTitle(content: string) {
  const normalized = content.toLowerCase();
  if (normalized.includes("subject:") || normalized.includes("dear ")) return "Email draft";
  if (normalized.includes("scorecard")) return "Scorecard draft";
  if (normalized.includes("leave")) return "Leave letter";
  return "Editable draft";
}

async function readAttachmentPreview(file: File): Promise<ChatAttachment> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const readable = ["txt", "md", "csv", "json", "html", "xml", "log", "pdf"].includes(extension) || file.type.startsWith("text/");
  if (!readable) return { name: file.name, type: file.type, size: file.size };

  const raw = await file.text().catch(() => "");
  const textPreview = extension === "pdf" ? extractPdfText(raw) : raw;
  return {
    name: file.name,
    type: file.type || extension,
    size: file.size,
    textPreview: textPreview.replace(/\s+/g, " ").trim().slice(0, 6000)
  };
}

function extractPdfText(raw: string) {
  const matches = raw.match(/\(([^()]{3,})\)/g) || [];
  const extracted = matches.map((value) => value.slice(1, -1).replace(/\\([()\\])/g, "$1")).join(" ");
  return extracted || raw.replace(/[^\x20-\x7E]+/g, " ");
}

function exportDocumentTextAsWord(content: string, title: string) {
  const message = { id: "document", role: "ASSISTANT" as const, content, createdAt: new Date().toISOString() };
  downloadBlob(`${safeFileName(title)}.doc`, new Blob([buildConversationHtml([message], title)], { type: "application/msword;charset=utf-8" }));
}

function exportDocumentTextAsPdf(content: string, title: string) {
  const message = { id: "document", role: "ASSISTANT" as const, content, createdAt: new Date().toISOString() };
  const popup = window.open("", "_blank", "width=900,height=700");
  if (!popup) return;
  popup.document.write(buildConversationHtml([message], title));
  popup.document.close();
  popup.focus();
  window.setTimeout(() => popup.print(), 250);
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

async function shareMessage(content: string, title: string) {
  if (navigator.share) {
    await navigator.share({ title, text: content });
    return;
  }
  await navigator.clipboard.writeText(content);
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
