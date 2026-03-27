"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { BusinessProvider } from "@/components/business-context";
import { GlobalAlert } from "@/components/global-alert";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <BusinessProvider>
          {children}
          <GlobalAlert />
        </BusinessProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}