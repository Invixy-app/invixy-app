"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

function SignInContent() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
      }
    } catch (error) {
      setError("Something went wrong");
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

  return (
   <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 via-white to-indigo-100">
  {/* Left Side - Illustration / Branding Section */}
  <div className="hidden md:flex w-1/2 items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/40 to-indigo-200/40 backdrop-blur-sm"></div>

    <div className="relative z-10 text-center px-8 space-y-6">
      <h1 className="text-5xl font-bold text-gray-800">Welcome Back to Invixy</h1>
      <p className="text-lg text-gray-600 max-w-md mx-auto">
        Manage your invoices, clients, and payments effortlessly.  
        Let Invixy simplify your business finances.
      </p>
      <img
        src="https://illustrations.popsy.co/blue/login.svg"
        alt="Sign in illustration"
        className="w-3/4 mx-auto drop-shadow-lg"
      />
    </div>
  </div>

  {/* Right Side - Sign In Form */}
  <div className="flex w-full md:w-1/2 items-center justify-center px-6 py-12">
    <Card className="w-full max-w-md shadow-xl border border-gray-200 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-gray-900">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Sign in to your Invixy account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className="focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className="focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <p className="text-sm text-gray-600 text-center">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  </div>
</div>

  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}