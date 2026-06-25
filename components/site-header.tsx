"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center font-bold text-xl tracking-tight">
          <Image src={"/logo.png"} alt="Invixy Logo" width={40} height={40} />
          <span className="text-foreground">Invixy</span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <Link href="/#features" className="hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          {isAuthenticated ? (
            <Link href="/dashboard" className="hidden md:inline-flex">
              <Button size="sm" className="font-semibold bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="hidden md:inline-flex text-sm font-medium hover:text-[var(--brand-cobalt)] transition-colors"
              >
                Sign In
              </Link>
              <Link href="/auth/signup" className="hidden md:inline-flex">
                <Button size="sm" className="font-semibold bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
      {mobileNavOpen && (
        <div className="border-t border-border/70 bg-background/95 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            <Link href="/#features" className="rounded-md px-2 py-1.5 hover:bg-muted hover:text-foreground" onClick={() => setMobileNavOpen(false)}>
              Features
            </Link>
            <Link href="/#pricing" className="rounded-md px-2 py-1.5 hover:bg-muted hover:text-foreground" onClick={() => setMobileNavOpen(false)}>
              Pricing
            </Link>
            <Link href="/about" className="rounded-md px-2 py-1.5 hover:bg-muted hover:text-foreground" onClick={() => setMobileNavOpen(false)}>
              About
            </Link>
            <div className="mt-2 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setMobileNavOpen(false)}>
                  <Button size="sm" className="w-full font-semibold bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin" onClick={() => setMobileNavOpen(false)}>
                    <Button size="sm" variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileNavOpen(false)}>
                    <Button size="sm" className="w-full font-semibold bg-[var(--brand-cobalt)] hover:bg-[var(--brand-indigo)] text-white">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
