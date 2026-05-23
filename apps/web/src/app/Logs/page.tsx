import { Header } from "@/components/layout/Header";

export default function LogsPage() {
  return (
    <main>
      <Header />
      <section className="zynex-section py-12">
        <div className="zynex-section-inner">
          <p className="zynex-label">Inference logs</p>
          <h1 className="zynex-heading mt-4 text-6xl leading-none">Request traces and provider health.</h1>
          <div className="mt-8 grid overflow-hidden rounded-lg border border-[var(--line-soft)] bg-white">
            {["ZyNexReq1001", "ZyNexReq1002", "ZyNexReq1003"].map((id) => (
              <div key={id} className="grid gap-3 border-b border-[var(--line-soft)] p-5 md:grid-cols-[1fr_120px_120px_120px]">
                <span className="font-mono text-xs font-bold uppercase">{id}</span>
                <span>Claude</span>
                <span>812ms</span>
                <span className="text-emerald-600">Success</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
