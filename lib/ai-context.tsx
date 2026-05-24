"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  createChatSessionAction,
  getChatSessionsAction,
  getChatSessionDetailAction,
  archiveChatSessionAction,
  deleteChatSessionAction,
  sendAiMessageAction,
  resetChatContextAction,
  editUserMessageAction,
  regenerateLastMessageAction,
  summarizeSessionAction,
} from "@/app/actions/chat-actions";

export type DbMessage = {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  timestamp: number;
  citations?: any[];
};

type AiContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  sessions: any[];
  messages: DbMessage[];
  isTyping: boolean;
  contextExceeded: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  sendMessage: (content: string, overrideSessionId?: string) => Promise<void>;
  createSession: () => Promise<string | null>;
  loadSession: (id: string) => Promise<void>;
  archiveSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  resetContext: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  clearMessages: () => void;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  regenerateMessage: () => Promise<void>;
  summarizeAndStartNewChat: () => Promise<void>;
};

const AiContext = createContext<AiContextType | undefined>(undefined);

export function AiProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [contextExceeded, setContextExceeded] = useState(false);
  const [selectedModel, setSelectedModelState] = useState<string>("llama-3.3-70b-versatile");
  const sendingRef = useRef(false);
  const currentRequestRef = useRef<string | null>(null);

  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("trendify-ai-model", model);
    }
  }, []);

  // Load persisted model preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trendify-ai-model");
      if (saved) setSelectedModelState(saved);
    }
  }, []);

  // Custom wrapper to sync active session ID with LocalStorage
  const setActiveSessionId = useCallback((id: string | null) => {
    setActiveSessionIdState(id);
    if (id) {
      localStorage.setItem("trendify-ai-active-session-id", id);
    } else {
      localStorage.removeItem("trendify-ai-active-session-id");
      setMessages([]);
      setContextExceeded(false);
    }
  }, []);

  // Fetch all sessions (active and archived) from MongoDB
  const refreshSessions = useCallback(async () => {
    try {
      const res = await getChatSessionsAction(true); // includeArchived = true
      if (res.success) {
        setSessions(res.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load chat sessions list:", e);
    }
  }, []);

  // Load message logs of a specific chat session
  const loadSession = useCallback(async (sessionId: string) => {
    setIsTyping(true);
    const requestKey = `load-${sessionId}`;
    currentRequestRef.current = requestKey;
    try {
      const res = await getChatSessionDetailAction(sessionId);
      if (currentRequestRef.current !== requestKey) {
        console.log(`[Context] Discarding stale loadSession response for ${sessionId}`);
        return;
      }
      if (res.success && res.session) {
        setMessages(res.session.messages || []);
        setContextExceeded(res.session.contextExceeded || false);
        setActiveSessionIdState(sessionId);
        localStorage.setItem("trendify-ai-active-session-id", sessionId);
      } else {
        toast.error("Failed to load conversation details");
        setActiveSessionId(null);
      }
    } catch {
      if (currentRequestRef.current === requestKey) {
        toast.error("Failed to fetch session details");
        setActiveSessionId(null);
      }
    } finally {
      if (currentRequestRef.current === requestKey) {
        setIsTyping(false);
      }
    }
  }, [setActiveSessionId]);

  // Create a new empty session
  const createSession = useCallback(async (): Promise<string | null> => {
    setIsTyping(true);
    const requestKey = `create-${Date.now()}`;
    currentRequestRef.current = requestKey;
    // Immediately clear the UI — don't wait for the async call
    setMessages([]);
    setContextExceeded(false);
    setActiveSessionIdState(null);
    localStorage.removeItem("trendify-ai-active-session-id");
    try {
      const res = await createChatSessionAction();
      if (currentRequestRef.current !== requestKey) {
        console.log("[Context] Discarding stale createSession response");
        return null;
      }
      if (res.success && res.sessionId) {
        setMessages([]); // Double check to keep it empty
        setActiveSessionId(res.sessionId);
        await refreshSessions();
        return res.sessionId;
      }
      return null;
    } catch {
      if (currentRequestRef.current === requestKey) {
        toast.error("Failed to start a new chat");
      }
      return null;
    } finally {
      if (currentRequestRef.current === requestKey) {
        setIsTyping(false);
      }
    }
  }, [setActiveSessionId, refreshSessions]);

  // Initialize and load sessions on mount
  useEffect(() => {
    async function init() {
      await refreshSessions();
      
      const saved = localStorage.getItem("trendify-ai-active-session-id");
      if (saved) {
        await loadSession(saved);
      }
    }
    init();
  }, [refreshSessions, loadSession]);

  // Archive / unarchive toggler
  const archiveSession = async (id: string) => {
    try {
      const res = await archiveChatSessionAction(id);
      if (res.success) {
        toast.success(res.status === "archived" ? "Conversation archived" : "Conversation unarchived");
        await refreshSessions();
      } else {
        toast.error("Failed to toggle archive status");
      }
    } catch {
      toast.error("Error archiving session");
    }
  };

  // Delete session
  const deleteSession = async (id: string) => {
    try {
      const res = await deleteChatSessionAction(id);
      if (res.success) {
        toast.success("Conversation deleted");
        if (activeSessionId === id) {
          setActiveSessionId(null);
        }
        await refreshSessions();
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch {
      toast.error("Error deleting session");
    }
  };

  // Reset context window of current chat (slices history to last 2 messages)
  const resetContext = async () => {
    if (!activeSessionId) return;
    setIsTyping(true);
    try {
      const res = await resetChatContextAction(activeSessionId);
      if (res.success && res.session) {
        setMessages(res.session.messages || []);
        setContextExceeded(false);
        toast.success("Chat context reset successfully. You can continue typing.");
        await refreshSessions();
      } else {
        toast.error("Failed to reset context history");
      }
    } catch {
      toast.error("Error resetting conversation context");
    } finally {
      setIsTyping(false);
    }
  };

  // Clear messages locally (reset active session view)
  const clearMessages = () => {
    if (activeSessionId) {
      deleteSession(activeSessionId);
    } else {
      setMessages([]);
      setContextExceeded(false);
    }
  };

  // Sends message to LangGraph and saves to MongoDB
  const sendMessage = async (content: string, overrideSessionId?: string) => {
    if (!content.trim() || sendingRef.current) return;
    sendingRef.current = true;
    let targetSessionId = overrideSessionId || activeSessionId;
    const requestKey = `send-${targetSessionId || "new"}-${Date.now()}`;
    currentRequestRef.current = requestKey;
    setIsTyping(true);

    try {
      // 1. Create a session on the fly if there isn't one active
      if (!targetSessionId) {
        const res = await createChatSessionAction();
        if (currentRequestRef.current !== requestKey) return;
        if (res.success && res.sessionId) {
          targetSessionId = res.sessionId;
          setMessages([]);
          setContextExceeded(false);
          setActiveSessionIdState(targetSessionId);
          localStorage.setItem("trendify-ai-active-session-id", targetSessionId);
          await refreshSessions();
        } else {
          toast.error("Failed to initialize chat session in database.");
          setIsTyping(false);
          sendingRef.current = false;
          return;
        }
      }

      if (currentRequestRef.current !== requestKey) return;

      // 2. Append optimistic user message to the UI instantly
      const optimisticMsg: DbMessage = {
        id: Math.random().toString(36).substring(7),
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // 3. Send message payload to Server Action with gl country parameter
      const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const gl = queryParams ? (queryParams.get("gl") || "us") : "us";
      const res = await sendAiMessageAction(targetSessionId, content, gl, selectedModel);

      if (currentRequestRef.current !== requestKey) {
        console.log(`[Context] Discarding stale sendMessage response for session ${targetSessionId}`);
        return;
      }

      if (res.success && res.session) {
        setMessages(res.session.messages || []);
        setContextExceeded(res.session.contextExceeded || false);
        await refreshSessions();
      } else if (res.contextExceeded) {
        setContextExceeded(true);
        toast.warning("Chat context limit reached. Clear history or reset context.");
      } else {
        toast.error(res.error || "Failed to process message with AI");
        // Remove optimistic message if server failed
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      }
    } catch (e: any) {
      console.error("Failed to send AI message:", e);
      if (currentRequestRef.current === requestKey) {
        toast.error("Connection error. Could not send message to AI.");
      }
    } finally {
      if (currentRequestRef.current === requestKey) {
        setIsTyping(false);
      }
      sendingRef.current = false;
    }
  };

  // Edit user message and re-run context
  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeSessionId || !newContent.trim()) return;
    setIsTyping(true);

    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex !== -1) {
      const optimistic = messages.slice(0, msgIndex + 1);
      optimistic[optimistic.length - 1].content = newContent;
      setMessages(optimistic);
    }

    try {
      const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const gl = queryParams ? (queryParams.get("gl") || "us") : "us";
      const res = await editUserMessageAction(activeSessionId, messageId, newContent, gl, selectedModel);

      if (res.success && res.session) {
        setMessages(res.session.messages || []);
        setContextExceeded(res.session.contextExceeded || false);
        await refreshSessions();
      } else {
        toast.error(res.error || "Failed to edit message");
        await loadSession(activeSessionId);
      }
    } catch {
      toast.error("Error editing message");
      await loadSession(activeSessionId);
    } finally {
      setIsTyping(false);
    }
  };

  // Regenerate last AI response
  const regenerateMessage = async () => {
    if (!activeSessionId) return;
    setIsTyping(true);

    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex !== -1) {
      setMessages(messages.slice(0, lastUserIndex + 1));
    }

    try {
      const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const gl = queryParams ? (queryParams.get("gl") || "us") : "us";
      const res = await regenerateLastMessageAction(activeSessionId, gl, selectedModel);

      if (res.success && res.session) {
        setMessages(res.session.messages || []);
        setContextExceeded(res.session.contextExceeded || false);
        await refreshSessions();
      } else {
        toast.error(res.error || "Failed to regenerate response");
        await loadSession(activeSessionId);
      }
    } catch {
      toast.error("Error regenerating response");
      await loadSession(activeSessionId);
    } finally {
      setIsTyping(false);
    }
  };

  const summarizeAndStartNewChat = useCallback(async () => {
    if (!activeSessionId) return;
    setIsTyping(true);
    const requestKey = `summarize-${Date.now()}`;
    currentRequestRef.current = requestKey;
    try {
      const res = await summarizeSessionAction(activeSessionId);
      if (currentRequestRef.current !== requestKey) return;
      if (res.success && res.summary) {
        const summary = res.summary;
        
        // Create new session
        const newSessionRes = await createChatSessionAction();
        if (currentRequestRef.current !== requestKey) return;
        if (newSessionRes.success && newSessionRes.sessionId) {
          const newId = newSessionRes.sessionId;
          
          // Clear local messages and context exceeded state
          setMessages([]);
          setContextExceeded(false);
          setActiveSessionIdState(newId);
          localStorage.setItem("trendify-ai-active-session-id", newId);
          
          await refreshSessions();
          
          // Send summary as first message in the new session
          const firstMsg = `Here is a summary of our previous conversation:\n\n"${summary}"\n\nHow should we continue?`;
          await sendMessage(firstMsg, newId);
          if (currentRequestRef.current === requestKey) {
            toast.success("Started a new chat using context summary!");
          }
        } else {
          toast.error("Failed to start a new chat session.");
        }
      } else {
        toast.error(res.error || "Failed to generate context summary.");
      }
    } catch (err: any) {
      if (currentRequestRef.current === requestKey) {
        toast.error("Error summarizing conversation: " + err.message);
      }
    } finally {
      if (currentRequestRef.current === requestKey) {
        setIsTyping(false);
      }
    }
  }, [activeSessionId, refreshSessions, sendMessage]);

  return (
    <AiContext.Provider
      value={{
        isOpen,
        setIsOpen,
        historyOpen,
        setHistoryOpen,
        activeSessionId,
        setActiveSessionId,
        sessions,
        messages,
        isTyping,
        contextExceeded,
        selectedModel,
        setSelectedModel,
        sendMessage,
        createSession,
        loadSession,
        archiveSession,
        deleteSession,
        resetContext,
        refreshSessions,
        clearMessages,
        editMessage,
        regenerateMessage,
        summarizeAndStartNewChat,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export function useAi() {
  const context = useContext(AiContext);
  if (!context) throw new Error("useAi must be used within an AiProvider");
  return context;
}
