"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Lock, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  InputOTP, InputOTPGroup, InputOTPSlot 
} from "@/components/ui/input-otp";

import { resetPasswordAction } from "@/app/actions/auth-actions";

function ResetPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGl = searchParams.get("gl") || "us";
  const email = searchParams.get("email") || "";

  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Missing email parameters. Redirecting back.");
      router.push(`/auth/forgot?gl=${currentGl}`);
    }
  }, [email, router, currentGl]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6 || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordAction(email, otpCode, password);
      if (res.success) {
        toast.success("Password reset successfully! You can now log in.");
        router.push(`/auth/login?gl=${currentGl}`);
      } else {
        toast.error(res.error || "Reset failed");
      }
    } catch (err) {
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg transition-all duration-300">
      <Card className="relative border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-xl pt-6">
        
        <CardHeader className="relative pb-4 flex flex-col items-center">
          <Link
            href={`/auth/forgot?gl=${currentGl}`}
            className="absolute left-4 top-4 text-zinc-450 hover:text-zinc-655 dark:hover:text-zinc-200 flex items-center gap-1 text-[10px] font-bold tracking-wide"
          >
            <ArrowLeft className="size-3" />
            Back
          </Link>
          
          <CardTitle className="text-2xl font-black text-center mt-6">Reset Password</CardTitle>
          <CardDescription className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Verify the code sent to <span className="font-semibold text-zinc-850 dark:text-zinc-200">{email}</span> and choose a new password.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4 pb-4">
            <div className="space-y-1.5 flex flex-col items-center pb-1">
              <Label className="text-zinc-455 text-[10px] font-bold tracking-wider mb-1">ENTER OTP CODE</Label>
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={(val) => setOtpCode(val)}
              >
                <InputOTPGroup className="gap-1.5">
                  <InputOTPSlot index={0} className="w-10 h-10 text-base rounded-md border text-center font-bold" />
                  <InputOTPSlot index={1} className="w-10 h-10 text-base rounded-md border text-center font-bold" />
                  <InputOTPSlot index={2} className="w-10 h-10 text-base rounded-md border text-center font-bold" />
                  <InputOTPSlot index={3} className="w-10 h-10 text-base rounded-md border text-center font-bold" />
                  <InputOTPSlot index={4} className="w-10 h-10 text-base rounded-md border text-center font-bold" />
                  <InputOTPSlot index={5} className="w-10 h-10 text-base rounded-md border text-center font-bold" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-normal max-w-[280px]">
              Note: If SMTP environment variables are not configured in your project, the OTP code is printed directly to the terminal's console output.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="reset-password" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                <Input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  className="pl-10 pr-10 h-11 bg-zinc-50/50 dark:bg-zinc-900/40 text-sm rounded-lg focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all border-zinc-250 dark:border-zinc-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-455 hover:text-zinc-650 dark:hover:text-zinc-200"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reset-confirm" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 size-4 text-zinc-400" />
                <Input
                  id="reset-confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-900/40 text-sm rounded-lg focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all border-zinc-250 dark:border-zinc-800"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white rounded-lg text-sm font-medium transition-colors"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-lg flex items-center justify-center p-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl min-h-[300px]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    }>
      <ResetPageContent />
    </Suspense>
  );
}
