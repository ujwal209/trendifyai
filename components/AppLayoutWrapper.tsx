"use client";

import React from "react";

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black transition-colors duration-200">
      {children}
    </div>
  );
}
