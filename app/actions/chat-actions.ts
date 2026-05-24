"use server";

import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { BaseMessage, HumanMessage, AIMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";
import { runChatAgent, ChatCitation } from "@/lib/ai/langgraph-agent";
import { groqKeyManager } from "@/lib/ai/groq-manager";

// Helper to get current user ID from session cookie
async function getCurrentUserId(): Promise<ObjectId | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("trendify_session")?.value;
    if (!token) return null;

    const db = await getDb();
    const session = await db.collection("sessions").findOne({ token });
    if (!session || Date.now() > session.expiresAt) return null;

    return session.userId as ObjectId;
  } catch {
    return null;
  }
}

// Get or create unique identifier for both authenticated users and guests
async function getOrCreateSessionIdentifier(): Promise<{ userId?: ObjectId; guestId?: string }> {
  const userId = await getCurrentUserId();
  if (userId) return { userId };

  const cookieStore = await cookies();
  let guestId = cookieStore.get("trendify_guest_id")?.value;
  if (!guestId) {
    guestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    // Store anonymous id for 30 days
    cookieStore.set("trendify_guest_id", guestId, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
  }
  return { guestId };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERALIZATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function deserializeMessages(dbMessages: any[]): BaseMessage[] {
  return dbMessages.map((m) => {
    let contentStr = "";
    if (typeof m.content === "string") {
      contentStr = m.content;
    } else if (m.content && typeof m.content === "object") {
      contentStr = JSON.stringify(m.content);
    } else {
      contentStr = String(m.content || "");
    }

    const fields = {
      content: contentStr,
      id: m.id,
      additional_kwargs: m.additional_kwargs || {},
      response_metadata: m.response_metadata || {},
    };

    if (m.role === "user") {
      return new HumanMessage(fields);
    } else if (m.role === "assistant") {
      const aiMsg = new AIMessage(fields);
      if (m.tool_calls) {
        aiMsg.tool_calls = m.tool_calls;
      }
      return aiMsg;
    } else if (m.role === "tool") {
      return new ToolMessage({
        ...fields,
        tool_call_id: m.tool_call_id,
        name: m.name,
      });
    } else {
      return new SystemMessage(fields);
    }
  });
}

function serializeMessages(messages: BaseMessage[]): any[] {
  return messages.map((m) => {
    let contentStr = "";
    if (typeof m.content === "string") {
      contentStr = m.content;
    } else if (m.content && typeof m.content === "object") {
      contentStr = JSON.stringify(m.content);
    } else {
      contentStr = String(m.content || "");
    }

    const serialized: any = {
      id: m.id,
      content: contentStr,
      additional_kwargs: m.additional_kwargs,
      response_metadata: m.response_metadata,
    };

    // Use _getType() helper from LangChain BaseMessage class
    const type = m._getType();
    if (type === "human") {
      serialized.role = "user";
    } else if (type === "ai") {
      serialized.role = "assistant";
      const aiMsg = m as AIMessage;
      if (aiMsg.tool_calls && aiMsg.tool_calls.length > 0) {
        serialized.tool_calls = aiMsg.tool_calls;
      }
    } else if (type === "tool") {
      serialized.role = "tool";
      const toolMsg = m as ToolMessage;
      serialized.tool_call_id = toolMsg.tool_call_id;
      serialized.name = toolMsg.name;
    } else {
      serialized.role = "system";
    }

    return serialized;
  });
}

function serializeSession(session: any) {
  if (!session) return null;
  return {
    ...session,
    _id: session._id.toString(),
    userId: session.userId ? session.userId.toString() : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAT ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function createChatSessionAction() {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  const newSession = {
    userId: userId || null,
    guestId: guestId || null,
    title: "New Chat",
    status: "active" as const, // active | archived
    contextExceeded: false,
    messages: [],
    citations: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try {
    const result = await db.collection("chat_sessions").insertOne(newSession);
    return {
      success: true,
      sessionId: result.insertedId.toString(),
      session: serializeSession({ ...newSession, _id: result.insertedId }),
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getChatSessionsAction(includeArchived = false) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else {
      query.guestId = guestId;
    }

    if (!includeArchived) {
      query.status = "active";
    }

    const sessions = await db
      .collection("chat_sessions")
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return {
      success: true,
      sessions: sessions.map(serializeSession),
    };
  } catch (e: any) {
    return { success: false, error: e.message, sessions: [] };
  }
}

export async function getChatSessionDetailAction(sessionId: string) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) {
      return { success: false, error: "Chat session not found" };
    }

    // Verify ownership
    if (userId && (!session.userId || session.userId.toString() !== userId.toString())) {
      return { success: false, error: "Unauthorized access to chat session" };
    } else if (guestId && session.guestId !== guestId && !session.userId) {
      return { success: false, error: "Unauthorized access to guest chat session" };
    }

    return {
      success: true,
      session: serializeSession(session),
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function archiveChatSessionAction(sessionId: string) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) return { success: false, error: "Session not found" };

    // Verify ownership
    if (userId && (!session.userId || session.userId.toString() !== userId.toString())) {
      return { success: false, error: "Unauthorized" };
    } else if (guestId && session.guestId !== guestId && !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const nextStatus = session.status === "archived" ? "active" : "archived";
    await db
      .collection("chat_sessions")
      .updateOne({ _id: new ObjectId(sessionId) }, { $set: { status: nextStatus, updatedAt: Date.now() } });

    return { success: true, status: nextStatus };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteChatSessionAction(sessionId: string) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) return { success: false, error: "Session not found" };

    // Verify ownership
    if (userId && (!session.userId || session.userId.toString() !== userId.toString())) {
      return { success: false, error: "Unauthorized" };
    } else if (guestId && session.guestId !== guestId && !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.collection("chat_sessions").deleteOne({ _id: new ObjectId(sessionId) });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getSharedChatSessionAction(sessionId: string) {
  const db = await getDb();
  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) {
      return { success: false, error: "Shared chat session not found" };
    }

    return {
      success: true,
      session: serializeSession(session),
      isReadOnly: true,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendAiMessageAction(sessionId: string, userMessage: string, gl?: string, model?: string) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) return { success: false, error: "Session not found" };

    // Verify ownership
    if (userId && (!session.userId || session.userId.toString() !== userId.toString())) {
      return { success: false, error: "Unauthorized" };
    } else if (guestId && session.guestId !== guestId && !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check context window limit banner before executing
    if (session.contextExceeded) {
      return { success: false, error: "Context limit exceeded. Reset context or start new chat.", contextExceeded: true };
    }

    // Fetch user context if authenticated
    let userContext: any = {
      currentRegion: gl || "us",
    };

    if (userId) {
      const user = await db.collection("users").findOne({ _id: userId });
      if (user) {
        userContext.email = user.email;
        userContext.country = user.country;
        userContext.categories = user.categories;
        userContext.brands = user.brands;
      }
      
      const watchlist = await db.collection("watchlist").find({ userId }).toArray();
      if (watchlist && watchlist.length > 0) {
        userContext.watchlist = watchlist.map((item: any) => ({
          productName: item.productName,
          productBrand: item.productBrand,
          productPrice: item.productPrice,
          productOriginalPrice: item.productOriginalPrice,
          productRating: item.productRating,
          source: item.offers?.[0]?.source || "Online Retailer",
        }));
      }
    }

    // Prepare message history for LangGraph agent: keep only human and ai messages and strip tool_calls
    const rawHistory = deserializeMessages(session.messages || []);
    const deserializedHistory = rawHistory
      .filter((m) => m._getType() === "human" || m._getType() === "ai")
      .map((m) => {
        if (m._getType() === "ai") {
          const aiMsg = m as AIMessage;
          return new AIMessage({
            content: aiMsg.content,
            id: aiMsg.id,
          });
        }
        return m;
      });

    // Run LangGraph Agent
    const agentResult = await runChatAgent(deserializedHistory, userMessage, userContext, model);

    if (agentResult.contextExceeded) {
      await db
        .collection("chat_sessions")
        .updateOne(
          { _id: new ObjectId(sessionId) },
          { $set: { contextExceeded: true, updatedAt: Date.now() } }
        );
      return { success: true, contextExceeded: true };
    }

    // Serialize LangGraph output messages list to save in MongoDB
    const serializedNewHistory = serializeMessages(agentResult.fullHistory);

    // Build a set of old message IDs so we can identify truly new messages
    const oldMessageIds = new Set((session.messages || []).map((m: any) => m.id));

    // Map timestamps: preserve old messages as-is; stamp new messages with current time
    const finalDbMessages = serializedNewHistory.map((m, index) => {
      if (m.id && oldMessageIds.has(m.id)) {
        // This message existed in the previous session — return the stored version to preserve metadata
        const existing = session.messages.find((orig: any) => orig.id === m.id);
        if (existing) return existing;
      }

      // This is a genuinely new message — stamp it with a fresh timestamp
      const dbMsg: any = {
        ...m,
        id: m.id || Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      };

      // Attach citations ONLY to the final assistant message of this turn
      if (index === serializedNewHistory.length - 1 && m.role === "assistant") {
        dbMsg.citations = agentResult.citations;
        console.log(`[ChatAction] Saved final AI reply (len=${dbMsg.content?.length ?? 0}) with ${agentResult.citations.length} citations`);
      }
      return dbMsg;
    });

    console.log(`[ChatAction] Total DB messages: ${finalDbMessages.length}, last role: ${finalDbMessages[finalDbMessages.length-1]?.role}, last content len: ${finalDbMessages[finalDbMessages.length-1]?.content?.length}`);

    // Auto-generate title from the first message
    let updatedTitle = session.title;
    if (session.title === "New Chat" && userMessage.trim()) {
      updatedTitle = userMessage.slice(0, 35).trim() + (userMessage.length > 35 ? "..." : "");
    }

    // Update session record in MongoDB
    await db.collection("chat_sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          title: updatedTitle,
          messages: finalDbMessages,
          citations: agentResult.citations, // Active citations
          contextExceeded: false,
          updatedAt: Date.now(),
        },
      }
    );

    const updatedSession = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    return {
      success: true,
      session: serializeSession(updatedSession),
    };
  } catch (e: any) {
    console.error("Error inside sendAiMessageAction:", e);
    return { success: false, error: e.message };
  }
}

export async function resetChatContextAction(sessionId: string) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) return { success: false, error: "Session not found" };

    // Verify ownership
    if (userId && (!session.userId || session.userId.toString() !== userId.toString())) {
      return { success: false, error: "Unauthorized" };
    } else if (guestId && session.guestId !== guestId && !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const messages = session.messages || [];
    
    // Slice history to keep only the last 2 messages (1 user, 1 assistant) to reset the context window
    const keptMessages = messages.slice(-2);

    await db.collection("chat_sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          messages: keptMessages,
          contextExceeded: false,
          updatedAt: Date.now(),
        },
      }
    );

    const updatedSession = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    return {
      success: true,
      session: serializeSession(updatedSession),
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function editUserMessageAction(sessionId: string, messageId: string, newContent: string, gl?: string, model?: string) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) return { success: false, error: "Session not found" };

    // Verify ownership
    if (userId && (!session.userId || session.userId.toString() !== userId.toString())) {
      return { success: false, error: "Unauthorized" };
    } else if (guestId && session.guestId !== guestId && !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const messages = session.messages || [];
    const msgIndex = messages.findIndex((m: any) => m.id === messageId);
    if (msgIndex === -1) return { success: false, error: "Message not found" };

    // Slice messages up to the user message EXCLUSIVE (deleting all subsequent ones)
    const keptMessages = messages.slice(0, msgIndex);

    // Save kept messages to database
    await db.collection("chat_sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { messages: keptMessages, contextExceeded: false, updatedAt: Date.now() } }
    );

    // Re-run sendAiMessageAction with the new user message content
    return await sendAiMessageAction(sessionId, newContent, gl, model);
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function regenerateLastMessageAction(sessionId: string, gl?: string, model?: string) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) return { success: false, error: "Session not found" };

    // Verify ownership
    if (userId && (!session.userId || session.userId.toString() !== userId.toString())) {
      return { success: false, error: "Unauthorized" };
    } else if (guestId && session.guestId !== guestId && !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const messages = session.messages || [];
    let lastUserMsgIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMsgIndex = i;
        break;
      }
    }
    if (lastUserMsgIndex === -1) return { success: false, error: "No user message to regenerate" };

    const lastUserMsgContent = messages[lastUserMsgIndex].content;

    // Slice messages array up to the user message index EXCLUSIVE
    const keptMessages = messages.slice(0, lastUserMsgIndex);

    // Save kept messages to database
    await db.collection("chat_sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { messages: keptMessages, contextExceeded: false, updatedAt: Date.now() } }
    );

    // Re-run sendAiMessageAction with the last user message content
    return await sendAiMessageAction(sessionId, lastUserMsgContent, gl, model);
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function summarizeSessionAction(sessionId: string) {
  const { userId, guestId } = await getOrCreateSessionIdentifier();
  const db = await getDb();

  try {
    const session = await db
      .collection("chat_sessions")
      .findOne({ _id: new ObjectId(sessionId) });

    if (!session) return { success: false, error: "Session not found" };

    // Verify ownership
    if (userId && (!session.userId || session.userId.toString() !== userId.toString())) {
      return { success: false, error: "Unauthorized" };
    } else if (guestId && session.guestId !== guestId && !session.userId) {
      return { success: false, error: "Unauthorized" };
    }

    const messages = session.messages || [];
    if (messages.length === 0) {
      return { success: true, summary: "No conversation history to summarize." };
    }

    // Format chat history for summarization
    const formattedChat = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n");

    const systemPrompt = new SystemMessage(
      "You are a helpful e-commerce price comparison assistant. Summarize the following chat history in 1 or 2 concise sentences. " +
      "Focus on the products the user was interested in, their specifications, region, price ranges discussed, or search queries. " +
      "Provide only the direct summary text — no introductions, no 'Here is a summary', no explanations."
    );

    const userMessage = new HumanMessage(formattedChat);

    const chatModel = groqKeyManager.createChatModel(0.1, "llama-3.3-70b-versatile");
    const response = await chatModel.invoke([systemPrompt, userMessage]);

    const summary = typeof response.content === "string" 
      ? response.content.trim() 
      : JSON.stringify(response.content || "");

    return { success: true, summary };
  } catch (e: any) {
    console.error("Error summarizing session:", e);
    return { success: false, error: e.message };
  }
}
