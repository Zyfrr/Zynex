import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Read the ZyNex Terms of Use for AI chatbot access, inference logging, acceptable use, account responsibility, and service limitations."
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <article className="mx-auto max-w-4xl">
        <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">ZyNex legal</p>
        <h1 className="mt-3 font-display text-6xl font-semibold leading-none">Terms of Use</h1>
        <p className="mt-5 font-body text-base leading-8 text-[#5D6A7C]">
          These terms govern access to ZyNex, including AI chatbot conversations, inference metadata,
          provider integrations, observability dashboards, and ingestion APIs. Users are responsible
          for lawful use, account security, and reviewing AI-generated outputs before relying on them.
        </p>
        {["Account responsibility", "AI output limitations", "Inference logging", "Acceptable use", "Service availability", "Termination"].map((title) => (
          <section key={title} className="mt-8 border-t border-[#E8EEF7] pt-6">
            <h2 className="font-display text-4xl font-semibold">{title}</h2>
            <p className="mt-3 font-body text-sm leading-7 text-[#5D6A7C]">
              ZyNex may process prompts, responses, request metadata, latency, token usage, provider
              status, and diagnostic events to operate and improve the service. Users must not submit
              illegal, harmful, or unauthorized data and must maintain appropriate permissions for all
              uploaded or entered content.
            </p>
          </section>
        ))}
      </article>
    </main>
  );
}
