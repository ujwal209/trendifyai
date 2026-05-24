import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AiAssistant from "@/components/AiAssistant";
import { getSharedChatSessionAction } from "@/app/actions/chat-actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ShareChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ShareChatPage({ params }: ShareChatPageProps) {
  const { id } = await params;
  const result = await getSharedChatSessionAction(id);

  if (!result.success || !result.session) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] dark:bg-black font-sans flex flex-col justify-between">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Shared Conversation Not Found</h2>
          <p className="text-xs text-zinc-500 max-w-sm mt-1 dark:text-zinc-400">
            The link you followed may have expired, or the chat session was deleted by its creator.
          </p>
          <Link href="/" className="mt-6 rounded bg-[#2874f0] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-600 transition-all">
            Return to Homepage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const session = result.session;

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-black font-sans flex flex-col justify-between">
      <Header />
      <main className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 mt-6 flex-1 flex flex-col min-h-[600px] mb-8">
        
        {/* Back Link */}
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="flex items-center gap-1 text-xs font-bold text-[#2874f0] hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back to Shopping
          </Link>
        </div>

        {/* Share Header Meta */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-xs mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-base font-black text-zinc-900 dark:text-zinc-50 truncate max-w-md">
              {session.title}
            </h1>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 uppercase tracking-wider">
              Shared Conversation &middot; {session.messages.length} messages
            </p>
          </div>
          <Link href="/" className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#2874f0] hover:bg-blue-600 dark:bg-[#ffe500] dark:text-black dark:hover:bg-[#e6cf00] px-5 py-2.5 text-xs font-bold text-white shadow transition-all active:scale-95 text-center flex-shrink-0">
            Compare Prices on Trendify
          </Link>
        </div>

        {/* Read-Only Chat Widget Panel */}
        <div className="flex-grow border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden h-[600px] bg-white shadow-xs">
          <AiAssistant isDedicatedPage={true} isReadOnly={true} initialMessages={session.messages} />
        </div>

      </main>
      <Footer />
    </div>
  );
}
