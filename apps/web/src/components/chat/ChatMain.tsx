import { Mic, Paperclip, Search, Send, Sparkles, X } from "lucide-react";
import { suggestions } from "@/components/chat/chatData";

type ChatMainProps = {
  temporaryChat: boolean;
  setTemporaryChat: (value: boolean) => void;
  attachOpen: boolean;
  setAttachOpen: (value: boolean) => void;
  recording: boolean;
  setRecording: (value: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  authenticated: boolean;
  onLoginClick: () => void;
  onSignupClick: () => void;
};

export function ChatMain({
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
  onSignupClick
}: ChatMainProps) {
  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#E8EEF7] bg-white/90 px-5 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#4C596C]">
          <Sparkles size={17} className="text-[#4F46E5]" />
          <span>ZyNex Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="group relative">
            <button
              type="button"
              onClick={() => setTemporaryChat(!temporaryChat)}
              className={`flex h-9 items-center gap-2 rounded-full border px-3 font-body text-sm font-semibold transition ${
                temporaryChat
                  ? "border-[#4F46E5] bg-indigo-50 text-[#4F46E5]"
                  : "border-[#E8EEF7] bg-white text-[#4C596C] hover:border-[#D7DFEB]"
              }`}
            >
              <Sparkles size={15} />
              Temporary
            </button>
            <div className="pointer-events-none absolute right-0 top-11 z-40 w-64 translate-y-1 rounded-xl border border-[#E8EEF7] bg-[#111827] p-3 text-xs leading-5 text-white opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100">
              Temporary chat keeps the current conversation out of saved history and logging previews.
            </div>
          </div>
          {!authenticated && (
            <>
              <button
                type="button"
                onClick={onLoginClick}
                className="h-9 rounded-full border border-[#E8EEF7] bg-white px-4 font-body text-sm font-semibold text-[#253248] hover:border-[#4F46E5] hover:text-[#4F46E5]"
              >
                Login
              </button>
              <button
                type="button"
                onClick={onSignupClick}
                className="h-9 rounded-full bg-[#111827] px-4 font-body text-sm font-semibold text-white hover:bg-[#242A33]"
              >
                Sign up for free
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-8">
          <div className="w-full max-w-3xl text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#E8EEF7] bg-white shadow-sm">
              <img src="/assets/zynex-logos/zynex_favicon.svg" alt="" className="h-9 w-9 rounded-full" />
            </div>
            <h1 className="mt-5 font-display text-[52px] font-semibold leading-[0.95] tracking-normal text-[#111827]">
              How can ZyNex help today?
            </h1>
            <p className="mx-auto mt-4 max-w-xl font-body text-[15px] leading-7 text-[#5D6A7C]">
              Ask a question, practice a roleplay, compare providers, or inspect inference behavior.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  className="rounded-2xl border border-[#E8EEF7] bg-white p-4 text-left font-body text-sm font-semibold text-[#253248] shadow-sm transition hover:border-[#4F46E5] hover:text-[#4F46E5]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="shrink-0 bg-[#F7F8FB] px-5 pb-5">
          <div className="relative mx-auto max-w-3xl rounded-[24px] border border-[#DDE5F0] bg-white p-3 shadow-[0_18px_60px_rgba(15,36,66,0.08)]">
            {attachOpen && (
              <div className="absolute bottom-[96px] left-3 z-30 w-64 rounded-2xl border border-[#E8EEF7] bg-white p-2 shadow-2xl shadow-slate-900/12">
                <AttachAction label="Upload file" subtext="PDF, CSV, DOCX, TXT" />
                <AttachAction label="Connect source" subtext="Knowledge base or URL" />
                <AttachAction label="Add screenshot" subtext="Image context for the prompt" />
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Message ZyNex..."
              rows={3}
              className="min-h-[82px] w-full resize-none bg-transparent px-3 py-2 font-body text-[15px] leading-6 text-[#111827] outline-none placeholder:text-[#8A94A6]"
            />
            <div className="flex items-center justify-between gap-3 px-1 pt-2">
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
                  disabled={!prompt.trim()}
                  aria-label="Send message"
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#111827] text-white transition hover:bg-[#242A33] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
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

function AttachAction({ label, subtext }: { label: string; subtext: string }) {
  return (
    <button className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#F3F5FA]">
      <span className="block font-body text-sm font-semibold text-[#111827]">{label}</span>
      <span className="mt-0.5 block font-body text-xs font-medium text-[#6B7280]">{subtext}</span>
    </button>
  );
}
