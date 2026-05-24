"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const currentGl = searchParams.get("gl") || "us";

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center px-4 py-12 relative bg-[#fafafa] dark:bg-black font-sans antialiased">
      
      {/* Clean Background */}
      <div className="absolute inset-0 bg-[#fafafa] dark:bg-black pointer-events-none" />

      {/* Global Brand Header */}
      <div className="w-full max-w-lg mx-auto z-10 flex flex-col items-center mb-6 text-center select-none">
        <Link href={`/?gl=${currentGl}`} className="flex flex-col items-center cursor-pointer group">
          {/* Logo keeps its custom italic styling */}
          <span className="text-3xl font-black italic tracking-wide leading-none text-zinc-900 dark:text-white">
            Trendify
          </span>
          {/* Subheading text is styled cleanly */}
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-[#2874f0] dark:text-[#ffe500] leading-none mt-1.5 uppercase tracking-widest font-sans">
            Explore <span className="text-zinc-900 dark:text-white font-extrabold">Comparator</span>
            <span className="inline-block text-[8px] font-black leading-none ml-0.5">+</span>
          </span>
        </Link>
        <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-xs max-w-xs text-center font-medium leading-relaxed">
          Compare real-time prices across top platforms dynamically.
        </p>
      </div>

      {/* Active Authentication Card View */}
      <div className="w-full max-w-xl mx-auto z-10 flex justify-center items-center">
        {children}
      </div>

      {/* Shared Footer */}
      <div className="w-full max-w-xl mx-auto mt-8 flex items-center justify-center gap-3.5 z-10 text-[10px] text-zinc-400 dark:text-zinc-600 font-semibold tracking-wide">
        <span>Trendify © 2026</span>
        <span className="text-zinc-200 dark:text-zinc-800">|</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" />
          SSL Secured
        </span>
      </div>

    </div>
  );
}
