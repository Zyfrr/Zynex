"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

export function SessionProviderShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="bottom-right" richColors closeButton />
    </SessionProvider>
  );
}
