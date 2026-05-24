"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, Loader2, KeyRound, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { sendResetOtpAction } from "@/app/actions/auth-actions";

function ForgotPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGl = searchParams.get("gl") || "us";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await sendResetOtpAction(email);
      if (res.success) {
        toast.success(
          res.deliveryMethod === "email"
            ? "Reset code sent to your email!"
            : "Reset code generated in console log!"
        );
        router.push(`/auth/reset?email=${encodeURIComponent(res.email || email)}&gl=${currentGl}`);
      } else {
        toast.error(res.error || "Failed to send reset code");
      }
    } catch (err) {
      toast.error("An error occurred while sending reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg transition-all duration-300">
      <Card className="relative border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-xl pt-6">
        
        <CardHeader className="relative pb-4 flex flex-col items-center">
          <Link
            href={`/auth/login?gl=${currentGl}`}
            className="absolute left-4 top-4 text-zinc-450 hover:text-zinc-655 dark:hover:text-zinc-200 flex items-center gap-1 text-[10px] font-bold tracking-wide"
          >
            <ArrowLeft className="size-3" />
            Back
          </Link>
          
          <CardTitle className="text-2xl font-black text-center mt-6">Forgot Password</CardTitle>
          <CardDescription className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Enter your email address and we'll send a 6-digit OTP code to reset your password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleForgotPassword}>
          <CardContent className="space-y-4 pb-4">
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-900/40 text-sm rounded-lg focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all border-zinc-250 dark:border-zinc-800"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white rounded-lg text-sm font-medium transition-colors"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Sending Reset Code...
                </>
              ) : (
                "Send Reset Code"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ForgotPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-lg flex items-center justify-center p-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    }>
      <ForgotPageContent />
    </Suspense>
  );
}
