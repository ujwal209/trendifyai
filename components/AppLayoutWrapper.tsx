"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAi } from "@/lib/ai-context";
import AiAssistant from "@/components/AiAssistant";
import { getCurrentUserAction } from "@/app/actions/auth-actions";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useAi();
  const pathname = usePathname();
  const isDedicatedRoute = pathname.startsWith("/ai-assistant");

  useEffect(() => {
    // If it's the dedicated assistant page, do not auto-open the drawer
    if (isDedicatedRoute) return;

    async function checkAuthAndOpen() {
      try {
        const user = await getCurrentUserAction();
        if (!user) {
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Auth check failed in AppLayoutWrapper:", err);
      }
    }
    checkAuthAndOpen();
  }, [setIsOpen, isDedicatedRoute]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black transition-colors duration-200 relative overflow-x-hidden">
      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {children}
      </div>

      {/* AI Assistant Right Sidebar Drawer (Fixed Overlay like before) */}
      {isOpen && !isDedicatedRoute && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Drawer Container */}
          <div className="absolute inset-y-0 right-0 flex max-w-full z-50">
            <div className="w-screen max-w-md sm:max-w-lg transform bg-white dark:bg-zinc-950 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col h-full border-l border-zinc-200 dark:border-zinc-900 animate-in slide-in-from-right">
              <AiAssistant isDedicatedPage={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
