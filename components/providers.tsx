"use client";

import { SessionProvider } from "next-auth/react";
import { BusinessProvider } from "@/components/business-context";
import { GlobalAlert } from "@/components/global-alert";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <BusinessProvider>
        {children}
        <GlobalAlert />
      </BusinessProvider>
    </SessionProvider>
  );
}