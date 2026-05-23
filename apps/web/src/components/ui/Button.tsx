import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "zynex-button",
        variant === "primary" && "zynex-button-primary",
        variant === "ghost" && "zynex-button-ghost",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <span className="zynex-arrow-wrap" aria-hidden="true">
        <span className="zynex-arrow">→</span>
      </span>
    </button>
  );
}
