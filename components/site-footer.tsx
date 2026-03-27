import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-background">
      <div className=" mx-auto px-6 py-8 lg:px-8">
        {/* Top section */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 font-semibold text-lg">
              <Link
                href="/"
                className="flex items-center font-bold text-xl tracking-tight"
              >
                <Image
                  src={"/logo.png"}
                  alt="Invixy Logo"
                  width={40}
                  height={40}
                />
                <span className="text-foreground">Invixy</span>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Modern invoicing and financial tools designed for growing
              businesses.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4">
              Product
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/#features"
                  className="hover:text-[var(--brand-cobalt)] transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#pricing"
                  className="hover:text-[var(--brand-cobalt)] transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/about"
                  className="hover:text-[var(--brand-cobalt)] transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-[var(--brand-cobalt)] transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="hover:text-[var(--brand-cobalt)] transition-colors"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-4">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-[var(--brand-cobalt)] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-[var(--brand-cobalt)] transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Invixy. All rights reserved.</p>
          <p>Built for modern businesses.</p>
        </div>
      </div>
    </footer>
  );
}
