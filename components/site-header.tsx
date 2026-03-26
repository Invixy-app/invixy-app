"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center font-bold text-xl tracking-tight">
          <Image src={"/logo.png"} alt="Invixy Logo" width={40} height={40} />
          <span className="text-foreground">Invixy</span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="font-semibold bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-sm font-medium hover:text-[var(--brand-cobalt)] transition-colors"
              >
                Sign In
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="font-semibold bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
