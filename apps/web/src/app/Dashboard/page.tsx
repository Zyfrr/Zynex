import { Header } from "@/components/layout/Header";
import { DashboardPreview } from "@/components/dashboard/DashboardPreview";

export default function DashboardPage() {
  return (
    <main>
      <Header />
      <section className="zynex-section py-12">
        <div className="zynex-section-inner">
          <p className="zynex-label">Observability dashboard</p>
          <h1 className="zynex-heading mt-4 text-6xl leading-none">Latency, throughput, tokens, errors.</h1>
          <DashboardPreview />
        </div>
      </section>
    </main>
  );
}
