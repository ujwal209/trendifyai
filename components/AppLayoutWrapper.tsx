"use client";

import React from "react";
import { useAi } from "@/lib/ai-context";
import AiAssistant from "@/components/AiAssistant";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useAi();

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black transition-colors duration-200 relative overflow-x-hidden">
      {/* Main Content */}
      <div className="flex-grow flex flex-col">
        {children}
      </div>

      {/* AI Assistant Right Sidebar Drawer */}
      {isOpen && (
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
