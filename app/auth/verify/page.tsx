"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Your email has been successfully verified.");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to verify email.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <AuthShell
      heading="Verify your email to activate all account features."
      subheading="Email verification helps protect your account and ensures reliable delivery of important notifications."
    >
      <Card className="w-full shadow-sm border-border/80">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
             We are verifying your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-4">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-center font-medium">{message}</p>
              <Button asChild className="w-full">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-center font-medium text-red-600">{message}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/auth/signup">Back to Sign Up</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
