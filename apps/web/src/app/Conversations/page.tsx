import { Header } from "@/components/layout/Header";

export default function ConversationsPage() {
  return (
    <main>
      <Header />
      <section className="zynex-section py-12">
        <div className="zynex-section-inner">
          <p className="zynex-label">Conversation control</p>
          <h1 className="zynex-heading mt-4 text-6xl leading-none">List, resume, and cancel sessions.</h1>
          <div className="mt-8 overflow-hidden rounded-lg border border-[var(--line-soft)]">
            {["Enterprise discovery", "Objection handling", "Renewal pitch"].map((title, index) => (
              <div key={title} className="grid gap-3 border-b border-[var(--line-soft)] bg-white p-5 md:grid-cols-[1fr_140px_140px]">
                <strong>{title}</strong>
                <span className="font-mono text-xs font-bold uppercase text-[var(--body-soft)]">{index === 1 ? "Cancelled" : "Active"}</span>
                <span className="font-mono text-xs font-bold uppercase text-[var(--primary-indigo)]">Resume</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
