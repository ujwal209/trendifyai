"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send, X, Trash2, Search, ShieldAlert, Heart,
  User, ExternalLink, Plus, Archive, Share2, MessageSquare,
  Check, ArchiveRestore, Moon, Sun, ArrowLeft, Copy, Edit2, RotateCw, ChevronDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAi } from "@/lib/ai-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";

function cleanToolTags(content: string): string {
  if (!content) return "";
  let cleaned = content;
  // Strip <function/...>...</function> or unclosed <function/...>
  cleaned = cleaned.replace(/<function\/[^>]*>[\s\S]*?<\/function>/gi, "");
  cleaned = cleaned.replace(/<function\/[^>]*>/gi, "");
  // Strip <tool_call>...</tool_call> or <tool_call>
  cleaned = cleaned.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "");
  cleaned = cleaned.replace(/<tool_call>[^>]*>/gi, "");
  // Strip <tool>...</tool> or <tool>
  cleaned = cleaned.replace(/<tool>[\s\S]*?<\/tool>/gi, "");
  cleaned = cleaned.replace(/<tool>[^>]*>/gi, "");
  return cleaned.trim();
}

function parseSuggestions(content: string): { cleanedContent: string; suggestions: string[] } {
  if (!content) return { cleanedContent: "", suggestions: [] };
  
  let cleanedContent = cleanToolTags(content);
  
  const suggestionsRegex = /<!--\s*suggestions:\s*(\[[\s\S]*?\])\s*-->/;
  const match = cleanedContent.match(suggestionsRegex);
  
  if (match) {
    try {
      const suggestions = JSON.parse(match[1]);
      if (Array.isArray(suggestions)) {
        // Strip the suggestions comment block from the content
        cleanedContent = cleanedContent.replace(suggestionsRegex, "").trim();
        return { cleanedContent, suggestions: suggestions.map(s => String(s).trim()) };
      }
    } catch (e) {
      console.error("Failed to parse suggestions JSON from comment:", e);
    }
  }
  
  return { cleanedContent, suggestions: [] };
}

interface AiAssistantProps {
  isDedicatedPage?: boolean;
  isReadOnly?: boolean;
  initialMessages?: any[];
}

const QUICK_PROMPTS = [
  {
    title: "Find Cheap Electronics",
    description: "Compare deals and prices across major tech stores",
    text: "Find cheap electronics",
    icon: Search
  },
  {
    title: "Watchlist Products",
    description: "Learn how to track discounts and price changes",
    text: "How do I save to Watchlist?",
    icon: Heart
  },
  {
    title: "Check Discount Rules",
    description: "Find out how we apply coupon calculations",
    text: "Show discount rules",
    icon: ShieldAlert
  },
  {
    title: "Update Region",
    description: "Modify your location, currency, and preferences",
    text: "Update my shopping region",
    icon: User
  },
];

export default function AiAssistant({
  isDedicatedPage = false,
  isReadOnly = false,
  initialMessages = [],
}: AiAssistantProps) {
  const router = useRouter();
  const {
    messages: contextMessages,
    sendMessage,
    isTyping: contextIsTyping,
    setIsOpen,
    sessions,
    activeSessionId,
    loadSession,
    createSession,
    archiveSession,
    deleteSession,
    resetContext,
    contextExceeded,
    historyOpen,
    setHistoryOpen,
    editMessage,
    regenerateMessage,
    selectedModel,
    setSelectedModel,
    summarizeAndStartNewChat,
  } = useAi();

  const messages = isReadOnly ? initialMessages : contextMessages;
  const isTyping = isReadOnly ? false : contextIsTyping;

  const [input, setInput] = useState("");
  const [sessionTab, setSessionTab] = useState<"active" | "archived">("active");
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [theme, setTheme] = useState("light");

  // Copy, Edit & Regenerate UI states
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState("");
  const [activeSourceDetail, setActiveSourceDetail] = useState<any | null>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  const GROQ_MODELS = [
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", badge: "Versatile" },
    { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B",  badge: "Fast" },
  ];

  // Currency symbol helpers
  const currentGl = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("gl") || "us") : "us";
  const activeCurrencySymbol = useMemo(() => {
    const countryCurrencyMap: Record<string, string> = {
      us: "$",
      in: "₹",
      uk: "£",
      ca: "C$",
      au: "A$",
      de: "€",
      fr: "€",
      jp: "¥",
    };
    return countryCurrencyMap[currentGl.toLowerCase()] || "$";
  }, [currentGl]);

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy message");
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);

  // Sync theme status on mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("trendify-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Hydration-safe desktop detection
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(media.matches);
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping || contextExceeded || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    const text = input;
    setInput("");
    try {
      await sendMessage(text);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleQuickPrompt = async (text: string) => {
    if (isTyping || contextExceeded || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await sendMessage(text);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleShare = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/share/chat/${sessionId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedSessionId(sessionId);
      setTimeout(() => setCopiedSessionId(null), 2000);
    } catch {}
  };

  const filteredSessions = useMemo(() => {
    const tab = sessions.filter((s) => s.status === sessionTab);
    if (!searchQuery.trim()) return tab;
    return tab.filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessions, sessionTab, searchQuery]);

  const activeSession = sessions.find((s) => s._id === activeSessionId);

  return (
    <SidebarProvider open={historyOpen} onOpenChange={setHistoryOpen} className="min-h-0 h-full w-full bg-background overflow-hidden">
      
      {/* 1. Sidebar Session History */}
      {!isReadOnly && isDedicatedPage && (
        <Sidebar side="left" collapsible="offcanvas" className="border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
          <SidebarHeader className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-4 bg-transparent select-none">
            <div className="flex items-center justify-between">
              {/* Text-Only Branding */}
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-[#2874f0] dark:text-white leading-none">
                  Trendify
                </span>
                <span className="text-[10px] font-semibold text-[#2874f0] dark:text-[#ffe500] bg-[#2874f0]/10 dark:bg-[#ffe500]/10 border border-[#2874f0]/20 dark:border-[#ffe500]/30 px-1.5 py-0.5 rounded-lg uppercase tracking-wider leading-none select-none">
                  AI
                </span>
              </div>
              <SidebarTrigger className="h-8 w-8 text-zinc-405 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer" />
            </div>
          </SidebarHeader>

          <SidebarContent className="p-3 space-y-4 no-scrollbar">
            {/* New Chat Button */}
            <Button
              onClick={createSession}
              className="w-full flex items-center justify-center gap-2 bg-[#2874f0] hover:bg-[#1b5dc7] dark:bg-[#ffe500] dark:text-black dark:hover:bg-[#d4be00] text-white text-xs font-bold py-2.5 rounded-xl shadow-md hover:shadow-lg cursor-pointer border-0 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[11px] font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 focus:outline-none focus:border-zinc-350 dark:focus:border-zinc-700 transition-colors"
              />
            </div>

            {/* Tabs for Active/Archived */}
            <div className="flex gap-1.5 p-1 bg-zinc-150/60 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/20 dark:border-zinc-800/20">
              {(["active", "archived"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSessionTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition-all cursor-pointer border-0",
                    sessionTab === tab
                      ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm font-semibold"
                      : "bg-transparent text-zinc-450 hover:text-zinc-705 dark:hover:text-zinc-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Conversations List */}
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 select-none">
                History
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1 mt-1">
                  {filteredSessions.length === 0 ? (
                    <div className="text-center py-12 flex flex-col items-center gap-3 select-none">
                      <MessageSquare className="h-6 w-6 text-zinc-300 dark:text-zinc-700" />
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                        {searchQuery ? "No matching chats" : `No ${sessionTab} chats`}
                      </p>
                    </div>
                  ) : (
                    filteredSessions.map((s) => (
                      <SidebarMenuItem key={s._id} className="group relative">
                        <SidebarMenuButton
                          isActive={activeSessionId === s._id}
                          onClick={() => loadSession(s._id)}
                          className={cn(
                            "w-full h-auto py-3 px-3 rounded-xl justify-start items-start border transition-all duration-200",
                            activeSessionId === s._id
                              ? "bg-[#2874f0]/10 dark:bg-[#ffe500]/5 border-[#2874f0]/20 dark:border-[#ffe500]/20 shadow-sm"
                              : "bg-transparent border-transparent hover:bg-[#2874f0]/5 dark:hover:bg-[#ffe500]/5 hover:border-zinc-200 dark:hover:border-zinc-800"
                          )}
                        >
                          <div className="flex gap-2.5 min-w-0 w-full pr-12">
                            <MessageSquare className={cn(
                              "h-3.5 w-3.5 flex-shrink-0 mt-0.5",
                              activeSessionId === s._id ? "text-[#2874f0] dark:text-[#ffe500]" : "text-zinc-400 dark:text-zinc-500"
                            )} />
                            <div className="min-w-0 flex flex-col text-left">
                              <span className={cn(
                                "text-xs font-bold truncate block leading-snug",
                                activeSessionId === s._id ? "text-[#2874f0] dark:text-[#ffe500]" : "text-zinc-700 dark:text-zinc-300"
                              )}>
                                {s.title}
                              </span>
                              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                                {new Date(s.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </SidebarMenuButton>
                        {/* Actions overlay on hover */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm z-10">
                          <button onClick={(e) => handleShare(e, s._id)} className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition-colors border-0 bg-transparent cursor-pointer" title="Share">
                            {copiedSessionId === s._id ? <Check className="h-3 w-3 text-green-500" /> : <Share2 className="h-3 w-3" />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); archiveSession(s._id); }} className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 transition-colors border-0 bg-transparent cursor-pointer" title={s.status === "archived" ? "Unarchive" : "Archive"}>
                            {s.status === "archived" ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteSession(s._id); }} className="p-1 rounded text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-zinc-700 transition-colors border-0 bg-transparent cursor-pointer" title="Delete">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex flex-col gap-2">
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-all uppercase tracking-wider bg-white dark:bg-zinc-900/40 shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Link>
          </SidebarFooter>
        </Sidebar>
      )}

      {/* 2. Chat Area Container (SidebarInset) */}
      <SidebarInset className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm relative z-10 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {!isReadOnly && isDedicatedPage && <SidebarTrigger className="h-8 w-8 text-zinc-500 cursor-pointer" />}
            {activeSession ? (
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] border-l border-zinc-200 dark:border-zinc-800 pl-2 ml-1 leading-none select-none">
                {activeSession.title}
              </span>
            ) : (
              <div className="flex items-center gap-1.5 select-none ml-1">
                <span className="text-sm font-bold tracking-tight text-[#2874f0] dark:text-white leading-none">
                  Trendify
                </span>
                <span className="text-[10px] font-semibold text-[#2874f0] dark:text-[#ffe500] bg-[#2874f0]/10 dark:bg-[#ffe500]/10 border border-[#2874f0]/20 dark:border-[#ffe500]/30 px-1.5 py-0.5 rounded-lg uppercase tracking-wider leading-none">
                  AI
                </span>
              </div>
            )}
          </div>
          
          {/* Header Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-0 bg-transparent cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </button>
            {!isDedicatedPage && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-0 bg-transparent cursor-pointer"
                title="Close Assistant"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 flex min-w-0 overflow-hidden relative">
          <div className="flex-1 flex flex-col min-w-0 relative bg-background">
            {/* Conversation view (Scroll Area) */}
        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto overflow-x-hidden relative z-0 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 flex flex-col"
        >
          {/* Ambient Glow blobs */}
          <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#2874f0]/8 dark:bg-[#2874f0]/4 blur-3xl z-0" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#ffe500]/6 dark:bg-[#ffe500]/3 blur-3xl z-0" />

          <div className={cn(
            "w-full max-w-3xl mx-auto px-4 py-8 relative z-10 flex flex-col flex-1",
            messages.length === 0 ? "justify-center items-center" : "space-y-6"
          )}>
            
            {/* Empty state: Vertically centered greeting + Suggestion Cards */}
            {messages.length === 0 && (
              <div className="w-full flex flex-col items-center justify-center text-center select-none animate-in fade-in duration-300">
                <div className="flex items-center gap-2 select-none mb-6">
                  <span className="text-4xl font-bold tracking-tight text-[#2874f0] dark:text-white">
                    Trendify
                  </span>
                  <span className="text-xs font-semibold text-[#2874f0] dark:text-[#ffe500] bg-[#2874f0]/10 dark:bg-[#ffe500]/10 border border-[#2874f0]/20 dark:border-[#ffe500]/30 px-2.5 py-1 rounded-xl uppercase tracking-wider shadow-2xs">
                    AI
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
                  How can I help you shop today?
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-md font-medium leading-relaxed">
                  Compare prices, track discounts, and query live shopping recommendations with your personal Trendify AI Assistant.
                </p>

                {/* Dynamic suggestions cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-xl">
                  {QUICK_PROMPTS.map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleQuickPrompt(p.text)}
                        className="group flex items-start gap-3.5 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#2874f0]/50 dark:hover:border-[#ffe500]/50 hover:bg-[#2874f0]/3 dark:hover:bg-[#ffe500]/3 hover:-translate-y-0.5 hover:shadow-md hover:shadow-blue-500/5 transition-all text-left w-full cursor-pointer shadow-xs"
                      >
                        <div className="h-8 w-8 rounded-xl bg-zinc-50 dark:bg-zinc-800 group-hover:bg-[#2874f0]/10 dark:group-hover:bg-[#ffe500]/10 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 leading-snug">
                            {p.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5 leading-snug">
                            {p.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message List */}
            {messages.map((msg) => {
              if (msg.role === "tool" || msg.role === "system") return null;

              // Skip intermediate assistant messages with tool calls or empty responses (prevents double bubbles)
              if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) return null;
              if (msg.role === "assistant" && !msg.content?.trim() && (!msg.citations || msg.citations.length === 0)) return null;

              const isUser = msg.role === "user";
              
              const { cleanedContent, suggestions } = isUser
                ? { cleanedContent: msg.content, suggestions: [] as string[] }
                : parseSuggestions(msg.content);

              const isLastAssistantMessage = !isUser && (() => {
                const assistantMsgs = messages.filter(m => m.role === "assistant" && !(m.tool_calls && m.tool_calls.length > 0) && m.content?.trim());
                return assistantMsgs[assistantMsgs.length - 1]?.id === msg.id;
              })();

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-4 w-full animate-in fade-in duration-200 relative group",
                    isUser ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0 select-none border border-zinc-200 dark:border-zinc-800">
                    {isUser ? (
                      <AvatarFallback className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold">
                        U
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-[#2874f0]/10 dark:bg-[#ffe500]/10 text-[#2874f0] dark:text-[#ffe500] text-[10px] font-bold border border-[#2874f0]/20 dark:border-[#ffe500]/30">
                        AI
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className={cn(
                    "flex flex-col min-w-0 max-w-[80%]",
                    isUser ? "items-end" : "items-start"
                  )}>
                    {/* Message bubble */}
                    {isUser && editingMsgId === msg.id ? (
                      <div className="w-full min-w-[280px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 flex flex-col gap-2 mt-1 shadow-sm select-text">
                        <textarea
                          value={editInput}
                          onChange={(e) => setEditInput(e.target.value)}
                          className="w-full text-xs text-zinc-900 dark:text-white bg-transparent border-0 outline-none resize-none font-medium leading-relaxed min-h-[50px]"
                          autoFocus
                        />
                        <div className="flex gap-2 justify-end select-none">
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-700 bg-transparent border-0 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await editMessage(msg.id, editInput);
                              setEditingMsgId(null);
                            }}
                            className="px-3 py-1 text-[10px] font-bold text-white bg-[#2874f0] hover:bg-[#1b5dc7] dark:bg-[#ffe500] dark:text-black dark:hover:bg-[#d4be00] rounded-lg border-0 cursor-pointer shadow-xs transition-colors"
                          >
                            Save & Submit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={cn(
                        "px-4 py-3 rounded-2xl text-xs break-words [word-break:break-word] overflow-hidden leading-relaxed shadow-xs border",
                        isUser
                          ? "bg-[#2874f0] dark:bg-blue-600 border-[#2874f0] dark:border-blue-600 text-white rounded-tr-none font-medium"
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
                      )}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap break-words">{cleanedContent}</p>
                        ) : (
                          <div className="markdown-prose text-xs leading-relaxed space-y-2 select-text break-words">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0 text-xs leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-xs leading-relaxed">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-xs leading-relaxed">{children}</ol>,
                                li: ({ children }) => <li className="font-medium">{children}</li>,
                                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#2874f0] dark:text-[#ffe500] hover:underline font-semibold transition-colors">{children}</a>,
                                strong: ({ children }) => <strong className="font-black text-zinc-900 dark:text-white">{children}</strong>,
                                table: ({ children }) => <div className="overflow-x-auto my-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs"><table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-[10px] text-left">{children}</table></div>,
                                thead: ({ children }) => <thead className="bg-zinc-50 dark:bg-zinc-900 font-bold text-zinc-600 dark:text-zinc-400">{children}</thead>,
                                th: ({ children }) => <th className="px-4 py-2 text-left font-bold uppercase tracking-wider text-[10px]">{children}</th>,
                                td: ({ children }) => <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 border-t border-zinc-200 dark:border-zinc-800 font-medium leading-relaxed">{children}</td>,
                              }}
                            >
                              {cleanedContent}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions menu: Copy, Edit, Regenerate */}
                    {editingMsgId !== msg.id && (
                      <div className={cn(
                        "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none",
                        isUser ? "justify-end" : "justify-start"
                      )}>
                        <button
                          onClick={() => handleCopyMessage(msg.id, cleanedContent)}
                          className="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-900 border-0 bg-transparent cursor-pointer transition-colors"
                          title="Copy message"
                        >
                          {copiedMsgId === msg.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        </button>
                        
                        {isUser && (
                          <button
                            onClick={() => {
                              setEditingMsgId(msg.id);
                              setEditInput(msg.content);
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-[#2874f0] hover:bg-zinc-50 dark:hover:bg-zinc-900 border-0 bg-transparent cursor-pointer transition-colors"
                            title="Edit message"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}

                        {!isUser && messages[messages.length - 1]?.id === msg.id && (
                          <button
                            onClick={regenerateMessage}
                            className="p-1 rounded text-zinc-400 hover:text-[#2874f0] hover:bg-zinc-50 dark:hover:bg-zinc-900 border-0 bg-transparent cursor-pointer transition-colors"
                            title="Regenerate response"
                          >
                            <RotateCw className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Suggestion pills */}
                    {!isUser && suggestions.length > 0 && isLastAssistantMessage && !isReadOnly && (
                      <div className="flex flex-wrap gap-2 mt-2 select-none">
                        {suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleQuickPrompt(suggestion)}
                            disabled={isTyping || contextExceeded}
                            className="px-3.5 py-1.5 text-[11px] font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-[#2874f0] dark:hover:border-[#ffe500] hover:text-[#2874f0] dark:hover:text-[#ffe500] hover:bg-[#2874f0]/5 dark:hover:bg-[#ffe500]/5 hover:-translate-y-0.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Citations for shopping comparisons */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto pb-2 pt-2.5 w-full scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                        {msg.citations.map((prod: any, idx: number) => {
                          const isSearchResult = prod.brand === "Search Result" || prod.price === 0;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => {
                                setActiveSourceDetail(prod);
                              }}
                              className="flex-shrink-0 w-[150px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 flex flex-col shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all select-none cursor-pointer"
                            >
                              {isSearchResult ? (
                                <div className="flex flex-col flex-1 justify-between min-h-[90px]">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                      {prod.logoUrl ? (
                                        <img src={prod.logoUrl} alt={prod.source} className="h-4 w-4 object-contain rounded-xs border border-zinc-200/50 dark:border-zinc-800/80 p-0.5 bg-white" />
                                      ) : null}
                                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block truncate max-w-[100px]">{prod.source}</span>
                                    </div>
                                    <h4 className="text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-3 leading-snug" title={prod.name}>
                                      {prod.name}
                                    </h4>
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-[#2874f0] dark:text-[#ffe500] hover:underline">View Source</span>
                                    <ExternalLink className="h-2.5 w-2.5 text-zinc-400" />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="relative aspect-square w-full bg-zinc-50 dark:bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center p-1.5 border border-zinc-100 dark:border-zinc-900">
                                    <img src={prod.image} alt={prod.name} className="h-full w-full object-contain" />
                                    <span className="absolute top-1 left-1 text-[8px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs text-[#2874f0] dark:text-[#ffe500] border border-zinc-200/50 dark:border-zinc-800/80 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1 shadow-2xs">
                                      {prod.logoUrl ? (
                                        <img src={prod.logoUrl} alt={prod.source} className="h-2.5 w-auto object-contain max-w-[30px]" />
                                      ) : null}
                                      <span>{prod.source}</span>
                                    </span>
                                  </div>
                                  <div className="mt-2 flex flex-col flex-1 justify-between">
                                    <div>
                                      <span className="text-[8px] font-semibold text-zinc-400 uppercase tracking-wider block">{prod.brand}</span>
                                      <h4 className="text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-snug mt-0.5" title={prod.name}>{prod.name}</h4>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                        {prod.currencySymbol || activeCurrencySymbol}{prod.price?.toLocaleString()}
                                      </span>
                                      <a 
                                        href={prod.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="p-1.5 rounded-lg bg-zinc-50 hover:bg-[#2874f0] border border-zinc-200 dark:bg-zinc-900 dark:hover:bg-[#ffe500] dark:hover:text-black dark:border-zinc-850 text-zinc-600 hover:text-white dark:text-zinc-300 transition-colors" 
                                        title="Buy"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink className="h-2.5 w-2.5" />
                                      </a>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 px-1 mt-1 flex-wrap select-none">
                      <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <button
                          onClick={() => setActiveSourceDetail(msg.citations![0])}
                          className="text-[9px] font-bold text-[#2874f0] dark:text-[#ffe500] hover:underline bg-transparent border-0 p-0 cursor-pointer flex items-center gap-1"
                        >
                          <span className="text-zinc-300 dark:text-zinc-700 font-normal">•</span>
                          <span>{msg.citations.length} {msg.citations.length === 1 ? "source" : "sources"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing bouncing animation */}
            {isTyping && (
              <div className="flex gap-4 w-full animate-in fade-in duration-200">
                <Avatar className="h-8 w-8 flex-shrink-0 select-none border border-zinc-200 dark:border-zinc-800">
                  <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 text-[10px] font-bold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="px-4 py-3.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-none flex gap-1.5 items-center shadow-xs">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 bg-zinc-400 dark:bg-zinc-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Sticky Bottom Panel Input (Big, spacious prompt box) */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-950 flex-shrink-0 w-full pt-3 pb-6 z-10 border-t border-zinc-100 dark:border-zinc-900">
          
          {/* Context Limit reached banner */}
          {contextExceeded && !isReadOnly && (
            <div className="w-full max-w-3xl mx-auto px-4 mb-4 animate-in fade-in">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl flex flex-col gap-2 shadow-xs">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300">Context Limit Reached</h4>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">Reset context or start a fresh chat to continue.</p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end flex-wrap">
                  <Button 
                    onClick={summarizeAndStartNewChat} 
                    disabled={isTyping}
                    size="sm" 
                    className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white border-0 cursor-pointer px-3 rounded-lg shadow-xs hover:shadow-sm transition-all"
                  >
                    Summarize & Start New Chat
                  </Button>
                  <Button onClick={resetContext} size="sm" className="h-7 text-[10px] font-semibold bg-amber-600 hover:bg-amber-700 text-white border-0 cursor-pointer px-3 rounded-lg">Reset Context</Button>
                  <Button onClick={createSession} size="sm" className="h-7 text-[10px] font-semibold bg-[#2874f0] hover:bg-[#1b5dc7] dark:bg-[#ffe500] dark:text-black dark:hover:bg-[#d4be00] border-0 cursor-pointer px-3 rounded-lg">New Chat</Button>
                </div>
              </div>
            </div>
          )}

          {/* Prompt form box */}
          {!isReadOnly ? (
            <form onSubmit={handleSend} className="w-full max-w-3xl mx-auto px-4">
              <div className="relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-700 rounded-3xl p-3.5 shadow-md focus-within:shadow-lg transition-all focus-within:ring-2 focus-within:ring-zinc-100 dark:focus-within:ring-zinc-900/30">
                <Textarea
                  ref={textareaRef as any}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown as any}
                  placeholder={contextExceeded ? "Start a new chat…" : "Ask Trendify AI anything…"}
                  disabled={isTyping || contextExceeded}
                  className="w-full bg-transparent border-0 outline-none focus-visible:ring-0 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 resize-none min-h-[56px] max-h-[180px] py-2 px-2 field-sizing-content leading-relaxed"
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 select-none">
                  <div className="flex items-center gap-3">
                    {/* Text-Only Branding */}
                    <div className="flex items-center gap-1.5 select-none px-2">
                      <span className="text-xs font-bold tracking-tight text-[#2874f0] dark:text-white leading-none">
                        Trendify
                      </span>
                      <span className="text-[9px] font-semibold text-[#2874f0] dark:text-[#ffe500] bg-[#2874f0]/10 dark:bg-[#ffe500]/10 border border-[#2874f0]/20 dark:border-[#ffe500]/30 px-1 py-0.5 rounded uppercase tracking-wider leading-none">
                        AI
                      </span>
                    </div>

                    {/* Model Selector inside prompt bar */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setModelDropdownOpen((v) => !v)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[10px] font-bold text-zinc-650 dark:text-zinc-350 transition-all cursor-pointer select-none"
                        title="Select AI Model"
                      >
                        <img
                          src="https://groq.com/favicon.ico"
                          alt="Groq"
                          className="h-3 w-3 object-contain rounded-xs"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span>
                          {GROQ_MODELS.find((m) => m.id === selectedModel)?.label || "Model"}
                        </span>
                        <ChevronDown className={cn("h-3 w-3 transition-transform", modelDropdownOpen && "rotate-180")} />
                      </button>
                      {modelDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setModelDropdownOpen(false)} />
                          <div className="absolute left-0 bottom-full mb-1.5 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Groq Models</p>
                            </div>
                            {GROQ_MODELS.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => { setSelectedModel(m.id); setModelDropdownOpen(false); }}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer border-0",
                                  selectedModel === m.id && "bg-[#2874f0]/5 dark:bg-[#ffe500]/5"
                                )}
                              >
                                <div>
                                  <p className={cn("text-xs font-semibold", selectedModel === m.id ? "text-[#2874f0] dark:text-[#ffe500]" : "text-zinc-800 dark:text-zinc-200")}>{m.label}</p>
                                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{m.badge}</p>
                                </div>
                                {selectedModel === m.id && <Check className="h-3.5 w-3.5 text-[#2874f0] dark:text-[#ffe500]" />}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isTyping || contextExceeded}
                    className="h-9 w-9 rounded-full bg-[#2874f0] hover:bg-[#1b5dc7] dark:bg-[#ffe500] dark:text-black dark:hover:bg-[#d4be00] border-0 cursor-pointer flex-shrink-0 disabled:opacity-30 transition-all shadow-xs"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 text-center mt-3 leading-none font-semibold select-none">
                Trendify AI can make mistakes. Verify important info.
              </p>
            </form>
          ) : (
            <div className="px-4 py-3 text-center select-none">
              <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Read-only snapshot · Trendify AI</p>
            </div>
          )}
        </div>
      </div>

      {activeSourceDetail && (() => {
        const isSearchResult = activeSourceDetail.brand === "Search Result" || activeSourceDetail.price === 0;
        return (
          <div className="absolute md:relative inset-y-0 right-0 w-full sm:w-80 md:w-80 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-full z-30 shadow-2xl md:shadow-none animate-in slide-in-from-right duration-200 select-none">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
              <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                {isSearchResult ? "Source Detail" : "Product Citation"}
              </span>
              <button 
                onClick={() => setActiveSourceDetail(null)}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border-0 bg-transparent cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
              {isSearchResult ? (
                <>
                  {/* Source website details */}
                  <div className="flex items-center gap-2 select-none">
                    {activeSourceDetail.logoUrl && (
                      <img 
                        src={activeSourceDetail.logoUrl} 
                        alt={activeSourceDetail.source} 
                        className="h-5 w-5 object-contain rounded-xs border border-zinc-200/50 dark:border-zinc-800/80 p-0.5 bg-white" 
                      />
                    )}
                    <span className="text-xs font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">{activeSourceDetail.source}</span>
                  </div>

                  {/* Article Title */}
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
                    {activeSourceDetail.name}
                  </h3>

                  {/* Snippet / Description */}
                  {activeSourceDetail.snippet && (
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/30 dark:border-zinc-800/40">
                      <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium">
                        {activeSourceDetail.snippet}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Product Specific Citation View */}
                  <div className="relative aspect-square w-full bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl overflow-hidden flex items-center justify-center p-4 border border-zinc-200/50 dark:border-zinc-800/80 select-none">
                    <img src={activeSourceDetail.image} alt={activeSourceDetail.name} className="max-h-full max-w-full object-contain" />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-zinc-455 dark:text-zinc-500 uppercase tracking-wider">{activeSourceDetail.brand}</span>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug mt-1">
                      {activeSourceDetail.name}
                    </h3>
                  </div>

                  {/* Rating / Price summary */}
                  <div className="flex items-center justify-between border-y border-zinc-100 dark:border-zinc-900 py-3 select-none">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">Best Price</span>
                      <span className="text-base font-black text-[#2874f0] dark:text-[#ffe500]">
                        {activeSourceDetail.currencySymbol || activeCurrencySymbol}{activeSourceDetail.price?.toLocaleString()}
                      </span>
                      {activeSourceDetail.originalPrice > activeSourceDetail.price && (
                        <span className="text-[10px] text-zinc-400 line-through ml-1.5 font-semibold">
                          {activeSourceDetail.currencySymbol || activeCurrencySymbol}{activeSourceDetail.originalPrice?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {activeSourceDetail.rating > 0 && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-zinc-400 uppercase block tracking-wider">Rating</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs font-bold text-zinc-850 dark:text-zinc-100">{activeSourceDetail.rating}</span>
                          <span className="text-xs text-amber-500">★</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compared Store Offers */}
                  {activeSourceDetail.offers && activeSourceDetail.offers.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">Compare Prices Across Stores</span>
                      <div className="space-y-2 select-none">
                        {activeSourceDetail.offers.map((offer: any, oIdx: number) => (
                          <div key={oIdx} className="flex items-center justify-between p-3 rounded-2xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
                            <div className="flex items-center gap-2.5">
                              {offer.logoUrl ? (
                                <img src={offer.logoUrl} alt={offer.source} className="h-5 w-5 object-contain rounded-xs bg-white border border-zinc-200/40 p-0.5" />
                              ) : null}
                              <div>
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{offer.source}</span>
                                {offer.delivery && (
                                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 block font-medium mt-0.5">{offer.delivery}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                  {activeSourceDetail.currencySymbol || activeCurrencySymbol}{offer.price?.toLocaleString()}
                                </span>
                                {offer.originalPrice > offer.price && (
                                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 line-through block mt-0.5">
                                    {activeSourceDetail.currencySymbol || activeCurrencySymbol}{offer.originalPrice?.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <a 
                                href={offer.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-2 rounded-xl bg-[#2874f0] hover:bg-[#1b5dc7] dark:bg-[#ffe500] dark:hover:bg-[#d4be00] dark:text-black text-white transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer action link */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10">
              <a 
                href={activeSourceDetail.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2874f0] hover:bg-[#1b5dc7] dark:bg-[#ffe500] dark:text-black dark:hover:bg-[#d4be00] text-white text-xs font-bold shadow-xs transition-all uppercase tracking-wider"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {isSearchResult ? "Open Full Source" : "Buy Now"}
              </a>
            </div>
          </div>
        );
      })()}
    </div>

  </SidebarInset>
</SidebarProvider>
  );
}
