import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line-soft)] bg-white/88 backdrop-blur-xl">
      <div className="border-b border-[var(--line-soft)] px-[var(--lm)] py-2 text-center font-mono text-[11px] font-bold uppercase text-[var(--body-soft)]">
        ZyNex Alpha · Inference logging for AI roleplay systems
      </div>
      <nav className="flex h-[60px] items-center justify-between px-[var(--lm)]">
        <Link href="/" className="font-display text-3xl font-semibold text-[var(--heading-dark)]">
          ZyNex
        </Link>
        <div className="hidden items-center gap-8 font-mono text-xs font-bold uppercase text-[var(--body-soft)] md:flex">
          <Link href="/Dashboard">Dashboard</Link>
          <Link href="/Chat">Chat</Link>
          <Link href="/Conversations">Conversations</Link>
          <Link href="/Logs">Logs</Link>
        </div>
        <div className="flex items-center gap-3">
          <Button href="/Login" kind="header-login">
            Login
          </Button>
          <Button href="/Register" kind="header-signup" arrow arrowSmall>
            Start
          </Button>
        </div>
      </nav>
    </header>
  );
}
