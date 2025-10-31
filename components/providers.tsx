"use client";

import { SessionProvider } from "next-auth/react";
import { BusinessProvider } from "@/components/business-context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <BusinessProvider>
        {children}
      </BusinessProvider>
    </SessionProvider>
  );
}