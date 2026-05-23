import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

const metrics = [
  ["p95 latency", "812ms"],
  ["streams today", "1,428"],
  ["error rate", "0.7%"]
];

const phases = [
  ["01", "Chat runtime", "Multi-turn AI roleplay with short context memory and streaming SSE responses."],
  ["02", "SDK wrapper", "Captures provider, model, latency, tokens, request status, and safe previews."],
  ["03", "Ingestion", "Validates, redacts, queues, and stores inference metadata without blocking chat."],
  ["04", "Dashboard", "Latency, throughput, token usage, and errors rendered through focused charts."]
];

export default function HomePage() {
  return (
    <main className="zynex-shell">
      <Header />
      <section className="zynex-section overflow-hidden py-20 md:py-28">
        <div className="absolute inset-x-[var(--lm)] top-0 h-full zynex-grid" />
        <div className="zynex-section-inner relative z-10 text-center">
          <p className="zynex-label">LLM inference observability</p>
          <h1 className="zynex-heading mx-auto mt-5 max-w-5xl text-[58px] leading-[0.96] md:text-[68px]">
            Build roleplay agents with logs, metrics, and trust.
            <span className="block bg-gradient-to-r from-orange-500 via-red-500 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
              Ship ZyNex with production signals.
            </span>
          </h1>
          <p className="zynex-body mx-auto mt-6 max-w-2xl text-lg leading-8">
            ZyNex combines a streaming chatbot, provider SDK, async ingestion pipeline,
            and analytics dashboard for AI coaching workflows.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button>Open Chat</Button>
            <Button variant="ghost">View Dashboard</Button>
          </div>

          <div className="zynex-card mx-auto mt-16 grid max-w-5xl overflow-hidden text-left md:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-[var(--line-soft)] p-6 md:border-b-0 md:border-r">
              <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-4">
                <span className="font-mono text-xs font-bold uppercase text-[var(--body-soft)]">
                  Live roleplay stream
                </span>
                <span className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-[11px] font-bold uppercase text-[var(--primary-indigo)]">
                  SSE active
                </span>
              </div>
              <div className="space-y-4 pt-5">
                <div className="max-w-[78%] rounded-lg border border-[var(--line-soft)] bg-white p-4">
                  <p className="font-mono text-[11px] font-bold uppercase text-[var(--body-soft)]">SDR</p>
                  <p className="mt-2 text-sm text-[var(--heading-dark)]">
                    I need to practice an enterprise discovery call for an AI analytics buyer.
                  </p>
                </div>
                <div className="ml-auto max-w-[82%] rounded-lg bg-[#0A0A1A] p-4 text-white">
                  <p className="font-mono text-[11px] font-bold uppercase text-indigo-200">ZyNex coach</p>
                  <p className="mt-2 text-sm leading-6 text-white/86">
                    Let us begin with pain discovery. I will score clarity, objection handling,
                    and next-step control while logging latency and token usage.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#FAFBFF] p-6">
              <p className="font-mono text-xs font-bold uppercase text-[var(--body-soft)]">Inference health</p>
              <div className="mt-5 grid gap-3">
                {metrics.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-[var(--line-soft)] py-3">
                    <span className="font-mono text-[11px] font-bold uppercase text-[var(--body-soft)]">{label}</span>
                    <span className="font-display text-3xl font-semibold text-[var(--heading-blue)]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="zynex-section py-16">
        <div className="zynex-section-inner">
          <p className="zynex-label">Implementation phases</p>
          <div className="mt-6 grid gap-px overflow-hidden rounded-lg border border-[var(--line-soft)] bg-[var(--line-soft)] md:grid-cols-4">
            {phases.map(([number, title, copy]) => (
              <article key={number} className="bg-white p-6">
                <span className="font-mono text-xs font-bold uppercase text-[var(--primary-indigo)]">{number}</span>
                <h2 className="zynex-heading mt-4 text-3xl">{title}</h2>
                <p className="zynex-body mt-3 text-sm leading-6">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
