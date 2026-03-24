"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validations/auth";
import Image from "next/image";

function ResetPasswordContent() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return (
         <div className="p-8 text-center bg-destructive/10 text-destructive rounded-lg">
            <p>Invalid or missing reset token.</p>
            <Link href="/auth/forgot-password" className="underline mt-2 block">
                Go back to forgot password
            </Link>
         </div>
    )
  }

  const validateForm = (): boolean => {
    try {
      resetPasswordSchema.parse(formData);
      setFieldErrors({});
      return true;
    } catch (error) {
       if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        for (const err of error.issues) {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        }
        setFieldErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, token }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess(true);
      setTimeout(() => router.push("/auth/signin"), 3000);

    } catch (error: any) {
       setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (success) {
      return (
         <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
             <div className="text-green-600 bg-green-50 p-4 rounded-full">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
             </div>
             <h2 className="text-2xl font-bold">Password reset successfully!</h2>
             <p className="text-muted-foreground">Redirecting you to sign in page...</p>
             <Button variant="outline" className="mt-4" onClick={() => router.push("/auth/signin")}>
                 Go to Sign In
             </Button>
         </div>
      );
  }

  return (
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
            <p className="text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={fieldErrors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
               {fieldErrors.password && (
                 <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>

             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                   className={fieldErrors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
               {fieldErrors.confirmPassword && (
                 <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
            
             <div className="text-center text-sm">
                <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                    Back to Sign In
                </Link>
            </div>
          </form>
        </div>
  );
}

export default function ResetPasswordPage() {
    return (
     <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Branding Section */}
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-10">
        <Link href={"/"} className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <Image src={"/logo.png"} alt="Invixy Logo" width={40} height={40} />
          <span>Invixy</span>
        </Link>
        
        <div className="space-y-6 max-w-lg">
           <h1 className="text-4xl font-bold tracking-tight">Secure your account</h1>
        </div>
        
        <div className="text-sm text-primary-foreground/60">
          &copy; {new Date().getFullYear()} Invixy. All rights reserved.
        </div>
      </div>

       {/* Right Side - Form Section */}
      <div className="flex items-center justify-center p-8">
        <Suspense fallback={<Loader2 className="animate-spin" />}>
            <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
    )
}
