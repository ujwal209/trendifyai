"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { loginAction } from "@/app/actions/auth-actions";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGl = searchParams.get("gl") || "us";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setLoading(true);
    try {
      const res = await loginAction(email, password);
      if (res.success) {
        toast.success("Successfully logged in!");
        if (res.onboarded) {
          router.push(`/?gl=${currentGl}`);
        } else {
          router.push("/onboarding");
        }
        router.refresh();
      } else {
        toast.error(res.error || "Login failed");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg transition-all duration-300">
      <Card className="relative border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-xl pt-6">
        
        <CardHeader className="pb-4 flex flex-col items-center">
          <CardTitle className="text-2xl font-black text-zinc-900 dark:text-white">Welcome Back</CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-1">
            Access your Trendify account and preferences.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-bold tracking-wide text-zinc-700 dark:text-zinc-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-900/40 text-sm rounded-lg focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all border-zinc-250 dark:border-zinc-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-bold tracking-wide text-zinc-700 dark:text-zinc-300">Password</Label>
                <Link
                  href={`/auth/forgot?gl=${currentGl}`}
                  className="text-[10px] font-extrabold tracking-wide text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 bg-zinc-50/50 dark:bg-zinc-900/40 text-sm rounded-lg focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all border-zinc-250 dark:border-zinc-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-450 hover:text-zinc-655 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white rounded-lg text-sm font-medium transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Logging In...
                </>
              ) : (
                "Log In"
              )}
            </Button>
            
            <div className="text-[11px] font-medium text-center text-zinc-500">
              Don't have an account?{" "}
              <Link 
                href={`/auth/signup?gl=${currentGl}`} 
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-lg flex items-center justify-center p-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
