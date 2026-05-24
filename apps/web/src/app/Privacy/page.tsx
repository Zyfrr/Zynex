import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the ZyNex Privacy Policy covering account data, chat messages, inference logs, metadata, retention, security, and third-party AI providers."
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <article className="mx-auto max-w-4xl">
        <p className="font-body text-sm font-bold uppercase text-[#4F46E5]">ZyNex privacy</p>
        <h1 className="mt-3 font-display text-6xl font-semibold leading-none">Privacy Policy</h1>
        <p className="mt-5 font-body text-base leading-8 text-[#5D6A7C]">
          ZyNex collects account information, authentication events, chat messages, inference logs,
          provider metadata, latency, token usage, and error diagnostics to provide secure AI chatbot
          and observability features. PII redaction and access controls are part of the intended
          production design.
        </p>
        {["Data we collect", "How inference logs are used", "Third-party providers", "Retention and deletion", "Security controls", "Your choices"].map((title) => (
          <section key={title} className="mt-8 border-t border-[#E8EEF7] pt-6">
            <h2 className="font-display text-4xl font-semibold">{title}</h2>
            <p className="mt-3 font-body text-sm leading-7 text-[#5D6A7C]">
              Data may be used to maintain sessions, deliver verification codes, process AI requests,
              generate analytics dashboards, debug provider failures, prevent abuse, and improve service
              reliability. Production deployments should configure retention, encryption, audit access,
              and deletion workflows based on customer and legal requirements.
            </p>
          </section>
        ))}
      </article>
    </main>
  );
}
