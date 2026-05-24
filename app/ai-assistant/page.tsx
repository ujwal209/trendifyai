"use client";

import React from "react";
import AiAssistant from "@/components/AiAssistant";

export default function AiAssistantPage() {
  return (
    <div className="h-dvh w-full overflow-hidden bg-background">
      <AiAssistant isDedicatedPage={true} />
    </div>
  );
}
