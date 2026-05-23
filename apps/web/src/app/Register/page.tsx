import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  return (
    <main>
      <Header />
      <section className="zynex-section py-16">
        <div className="zynex-section-inner grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="zynex-label">New workspace</p>
            <h1 className="zynex-heading mt-4 text-6xl leading-none">Create your ZyNex account</h1>
            <p className="zynex-body mt-5 max-w-md leading-7">
              Start with a secure account before creating conversations and inference streams.
            </p>
          </div>
          <form className="zynex-card grid gap-4 p-6">
            <label className="grid gap-2 font-mono text-xs font-bold uppercase text-[var(--body-soft)]">
              Name
              <input className="h-12 rounded-md border border-[var(--line-strong)] px-4 font-body text-sm normal-case" placeholder="Sarankumar Sankar" />
            </label>
            <label className="grid gap-2 font-mono text-xs font-bold uppercase text-[var(--body-soft)]">
              Email
              <input className="h-12 rounded-md border border-[var(--line-strong)] px-4 font-body text-sm normal-case" placeholder="you@company.com" />
            </label>
            <label className="grid gap-2 font-mono text-xs font-bold uppercase text-[var(--body-soft)]">
              Password
              <input className="h-12 rounded-md border border-[var(--line-strong)] px-4 font-body text-sm normal-case" placeholder="Minimum 8 characters" type="password" />
            </label>
            <Button type="button">Register</Button>
            <Link href="/Login" className="text-center font-mono text-xs font-bold uppercase text-[var(--primary-indigo)]">
              Already have access
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
}
