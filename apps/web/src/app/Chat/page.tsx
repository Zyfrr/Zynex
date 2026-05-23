import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export default function ChatPage() {
  return (
    <main>
      <Header />
      <section className="zynex-section py-10">
        <div className="zynex-section-inner grid min-h-[680px] gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="zynex-card p-5">
            <p className="font-mono text-xs font-bold uppercase text-[var(--body-soft)]">Conversations</p>
            <div className="mt-5 space-y-3">
              {["Enterprise discovery", "Pricing objection", "Follow-up coaching"].map((item) => (
                <div key={item} className="rounded-md border border-[var(--line-soft)] p-3">
                  <p className="font-body text-sm font-semibold text-[var(--heading-dark)]">{item}</p>
                  <p className="mt-1 font-mono text-[10px] font-bold uppercase text-[var(--body-soft)]">Active</p>
                </div>
              ))}
            </div>
          </aside>
          <section className="zynex-card flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--line-soft)] p-5">
              <div>
                <p className="font-mono text-xs font-bold uppercase text-[var(--primary-indigo)]">ZyNex roleplay</p>
                <h1 className="zynex-heading text-4xl">AI sales coaching stream</h1>
              </div>
              <Button variant="ghost">Cancel</Button>
            </div>
            <div className="flex-1 space-y-4 p-5">
              <div className="max-w-[72%] rounded-lg border border-[var(--line-soft)] p-4">
                <p className="text-sm">Help me practice a cold outbound conversation.</p>
              </div>
              <div className="ml-auto max-w-[78%] rounded-lg bg-[#0A0A1A] p-4 text-white">
                <p className="text-sm leading-6">I will simulate the prospect and score your discovery quality as we go.</p>
              </div>
            </div>
            <div className="border-t border-[var(--line-soft)] p-5">
              <div className="flex gap-3">
                <input className="h-12 flex-1 rounded-full border border-[var(--line-strong)] px-5 text-sm" placeholder="Type your message..." />
                <Button>Send</Button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
