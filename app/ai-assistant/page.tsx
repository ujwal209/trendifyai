"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogIn, ArrowLeft } from "lucide-react";
import AiAssistant from "@/components/AiAssistant";
import { Button } from "@/components/ui/button";
import { getCurrentUserAction } from "@/app/actions/auth-actions";

export default function AiAssistantPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const u = await getCurrentUserAction();
        setUser(u);
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f1f3f6] dark:bg-black font-sans">
        <div className="text-center space-y-3">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-zinc-900 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#2874f0] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-xs font-black text-zinc-550 tracking-wide uppercase dark:text-zinc-400">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-4 bg-[#f1f3f6] dark:bg-black font-sans">
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
          <div className="p-4 bg-blue-50 dark:bg-zinc-900/50 rounded-full inline-flex mb-5 border border-blue-100 dark:border-zinc-800">
            <User className="size-10 text-[#2874f0] dark:text-[#ffe500]" />
          </div>
          <h2 className="text-lg font-black text-zinc-900 dark:text-white">Account Authentication Required</h2>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-550 leading-relaxed">
            Please log in to access the full dedicated AI Assistant interface, including chat history, personalized recommendations, and saved watchlist integrations.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => router.push("/auth")}
              className="w-full bg-[#2874f0] hover:bg-blue-600 text-white font-bold rounded-xl h-11 cursor-pointer dark:bg-[#ffe500] dark:text-black dark:hover:bg-[#e6cf00]"
            >
              <LogIn className="size-4 mr-2" />
              Sign In to Account
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="w-full border-zinc-200 dark:border-zinc-800 font-bold rounded-xl h-11 cursor-pointer text-zinc-700 dark:text-zinc-350"
            >
              <ArrowLeft className="size-4 mr-2" />
              Back to Store
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full overflow-hidden bg-background">
      <AiAssistant isDedicatedPage={true} />
    </div>
  );
}

