import Link from "next/link";
import Image from "next/image";
import { BarChart3, FileText, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

type AuthShellProps = Readonly<{
  children: ReactNode;
  heading: string;
  subheading: string;
}>;

export function AuthShell({ children, heading, subheading }: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="relative hidden lg:flex overflow-hidden border-r border-border/70 bg-primary text-primary-foreground">
        <Image
          src="/Images/auth/sign_in_up.jpg"
          alt="Invoice dashboard preview"
          fill
          className="object-cover opacity-25"
          priority
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.22),transparent_38%),radial-gradient(circle_at_85%_75%,rgba(255,255,255,0.14),transparent_35%)]" />
        <div className="absolute right-10 top-24 w-44 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4" />
            Revenue Pulse
          </div>
          <p className="text-2xl font-bold leading-none">+18.4%</p>
          <p className="mt-2 text-xs text-primary-foreground/75">Month-over-month growth</p>
        </div>
        <div className="absolute left-10 top-40 w-40 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Compliance
          </div>
          <p className="text-sm text-primary-foreground/85">GST-ready workflows enabled</p>
        </div>

        <div className="relative z-10 flex w-full flex-col justify-between p-10">
          <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-md border border-white/15 bg-white/10 px-4 py-2 text-lg font-semibold tracking-tight backdrop-blur">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/20 text-sm font-bold">I</span>
            <span>Invixy</span>
          </Link>

          <div className="max-w-xl space-y-4">
            <h2 className="text-3xl font-semibold leading-tight text-balance">{heading}</h2>
            <p className="text-base leading-relaxed text-primary-foreground/80">{subheading}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2">
              <FileText className="h-4 w-4" />
              Smart invoices
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2">
              <ShieldCheck className="h-4 w-4" />
              Secure auth
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
