"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      } else {
        setError(data.error || "Something went wrong");
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Account Created!</CardTitle>
            <CardDescription className="text-center">
              Your account has been created successfully. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-blue-50 via-white to-indigo-100">
  {/* Left Side - Illustration / Branding Section */}
  <div className="hidden md:flex w-1/2 items-center justify-center relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/40 to-indigo-200/40 backdrop-blur-sm"></div>

    <div className="relative z-10 text-center px-8 space-y-6">
      <h1 className="text-5xl font-bold text-gray-800">Welcome to Invixy</h1>
      <p className="text-lg text-gray-600 max-w-md mx-auto">
        Simplify your invoicing process with our intelligent management system.  
        Track payments, manage clients, and grow your business — all in one place.
      </p>
      <img
        src="https://illustrations.popsy.co/blue/finance.svg"
        alt="Invoice management illustration"
        className="w-3/4 mx-auto drop-shadow-lg"
      />
    </div>
  </div>

  {/* Right Side - Signup Form */}
  <div className="flex w-full md:w-1/2 items-center justify-center px-6 py-12">
    <Card className="w-full max-w-md shadow-xl border border-gray-200 bg-white/80 backdrop-blur-md transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-gray-900">
          Create Account
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Sign up to start managing your invoices
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
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              required
              className="focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>

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
              placeholder="Create a password"
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
            Create Account
          </Button>

          <p className="text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  </div>
</div>


  );
}