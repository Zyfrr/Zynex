import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonKind =
  | "header-login"
  | "header-signup"
  | "hero-primary"
  | "hero-secondary"
  | "cta-primary"
  | "cta-secondary";

const kindToClass: Record<ButtonKind, string> = {
  "header-login":
    "hidden px-4 py-2 text-sm font-medium text-[#4C596C] transition-colors duration-300 hover:text-[#4F46E5] sm:block",
  "header-signup":
    "group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border-0 bg-[#4F46E5] px-4 py-[11px] font-mono text-[13px] font-semibold uppercase leading-[1.28] tracking-[-0.01em] text-white no-underline transition-colors duration-200 hover:bg-[#4338CA]",
  "hero-primary":
    "group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border-0 bg-[#4F46E5] px-[18px] py-[11px] font-mono text-[13px] font-semibold uppercase leading-[1.28] tracking-[-0.01em] text-white no-underline transition-colors duration-200 hover:bg-[#4338CA]",
  "hero-secondary":
    "group inline-flex items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-[#4F46E5] bg-transparent px-5 py-3 font-mono text-[13px] font-semibold uppercase leading-[1.28] tracking-[-0.01em] text-[#4F46E5] no-underline transition-colors duration-200 hover:bg-white/20",
  "cta-primary":
    "group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border-0 bg-[#4F46E5] px-[18px] py-[11px] font-mono text-[13px] font-semibold uppercase leading-[1.28] tracking-[-0.01em] text-white no-underline transition-colors duration-200 hover:bg-[#4338CA]",
  "cta-secondary":
    "group inline-flex items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-[#4F46E5] bg-transparent px-5 py-3 font-mono text-[13px] font-semibold uppercase leading-[1.28] tracking-[-0.01em] text-[#4F46E5] no-underline transition-colors duration-200 hover:bg-white/20",
};

type ButtonVariant = "primary" | "ghost" | "dark";

const variantToClass: Record<ButtonVariant, string> = {
  primary:
    "group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border-0 bg-[#4F46E5] px-[18px] py-[11px] font-mono text-[13px] font-semibold uppercase leading-[1.28] tracking-[-0.01em] text-white no-underline transition-colors duration-200 hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-45",
  ghost:
    "group inline-flex items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] border-[#4F46E5] bg-transparent px-5 py-3 font-mono text-[13px] font-semibold uppercase leading-[1.28] tracking-[-0.01em] text-[#4F46E5] no-underline transition-colors duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-45",
  dark:
    "group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border-0 bg-[#111111] px-[18px] py-[11px] font-mono text-[13px] font-semibold uppercase leading-[1.28] tracking-[-0.01em] text-white no-underline transition-colors duration-200 hover:bg-[#2A2A2A] disabled:cursor-not-allowed disabled:opacity-45",
};

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  kind?: ButtonKind;
  arrow?: boolean;
  arrowSmall?: boolean;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export function Button({
  children,
  href,
  variant = "primary",
  kind,
  arrow = false,
  arrowSmall = false,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  const baseClass = kind ? kindToClass[kind] : variantToClass[variant];

  const inner = (
    <>
      {children}
      {arrow && (
        <span
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20",
            arrowSmall ? "h-5 w-5" : "h-[26px] w-[26px]",
            variant === "ghost" && "bg-[#4F46E5]/15"
          )}
          aria-hidden="true"
        >
          <span className="absolute text-xs not-italic text-white transition duration-300 ease-out group-hover:translate-x-2.5 group-hover:-translate-y-2.5 group-hover:opacity-0">
            {"\u2197"}
          </span>
          <span className="absolute -translate-x-2.5 translate-y-2.5 text-xs not-italic text-white opacity-0 transition duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
            {"\u2197"}
          </span>
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(baseClass, className)}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} className={cn(baseClass, className)} {...rest}>
      {inner}
    </button>
  );
}

export default Button;
