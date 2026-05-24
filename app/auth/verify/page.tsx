"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { 
  InputOTP, InputOTPGroup, InputOTPSlot 
} from "@/components/ui/input-otp";

import { verifyOtpAction, sendOtpAction } from "@/app/actions/auth-actions";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGl = searchParams.get("gl") || "us";
  const email = searchParams.get("email") || "";

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Missing email parameters. Redirecting to sign up.");
      router.push(`/auth/signup?gl=${currentGl}`);
    }
  }, [email, router, currentGl]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpAction(email, otpCode);
      if (res.success) {
        toast.success("Email verified successfully! Welcome to Trendify.");
        router.push(`/onboarding?gl=${currentGl}`);
        router.refresh();
      } else {
        toast.error(res.error || "Invalid verification code");
      }
    } catch (err) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await sendOtpAction(email);
      if (res.success) {
        toast.success(
          res.deliveryMethod === "email"
            ? "Verification code resent successfully!"
            : "Verification code generated in console log!"
        );
      } else {
        toast.error(res.error || "Failed to resend code");
      }
    } catch (err) {
      toast.error("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-lg transition-all duration-300">
      <Card className="relative border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-950 rounded-xl pt-6">
        
        <CardHeader className="relative pb-4 flex flex-col items-center">
          <Link
            href={`/auth/signup?gl=${currentGl}`}
            className="absolute left-4 top-4 text-zinc-450 hover:text-zinc-650 dark:hover:text-zinc-200 flex items-center gap-1 text-[10px] font-bold tracking-wide"
          >
            <ArrowLeft className="size-3" />
            Back
          </Link>
          
          <CardTitle className="text-2xl font-black text-zinc-900 dark:text-white mt-6">Verify Email</CardTitle>
          <CardDescription className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
            We've sent a 6-digit verification code to <span className="font-semibold text-zinc-850 dark:text-zinc-200">{email}</span>.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleVerifyOtp}>
          <CardContent className="flex flex-col items-center space-y-4 py-2">
            <div className="space-y-2 flex flex-col items-center">
              <Label className="text-zinc-450 text-[10px] font-bold tracking-wider">ENTER OTP CODE</Label>
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white rounded-lg text-sm font-medium transition-colors"
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            <button
              type="button"
              onClick={handleResend}
              className="text-[10px] font-bold text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-300"
              disabled={resending || loading}
            >
              {resending ? "Resending Code..." : "Resend Verification Code"}
            </button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
