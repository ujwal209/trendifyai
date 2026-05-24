import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { BaseMessage, SystemMessage, AIMessage, ToolMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { groqKeyManager } from "@/lib/ai/groq-manager";
import { fetchProductsAction } from "@/app/actions/fetch-products";

// Define the structure of product citations
export interface ChatCitation {
  productId: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  source: string;
  image: string;
  link: string;
  currencySymbol?: string;
  logoUrl?: string;
  snippet?: string; // Add optional snippet for search citations
  offers?: any[];
}

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

// 1. Define State Annotation
export const ChatStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  citations: Annotation<ChatCitation[]>({
    reducer: (x, y) => {
      // Return combination of existing and new citations
      const seenIds = new Set(x.map((c) => c.productId));
      const combined = [...x];
      for (const item of y) {
        if (!seenIds.has(item.productId)) {
          combined.push(item);
          seenIds.add(item.productId);
        }
      }
      return combined;
    },
    default: () => [],
  }),
  contextExceeded: Annotation<boolean>({
    reducer: (_, y) => y,
    default: () => false,
  }),
  userContext: Annotation<any>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  selectedModel: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "llama-3.3-70b-versatile",
  }),
});

// 2. Define Product Search Tool
const searchProductsTool = tool(
  async ({ query, category, gl }) => {
    try {
      // Use existing fetchProductsAction Server Action to query SerpAPI/Serper
      const results = await fetchProductsAction(query, category || "all", gl || "us", 1);
      const activeGl = gl || "us";
      const symbol = countryCurrencyMap[activeGl.toLowerCase()] || "$";
      
      const mappedResults: ChatCitation[] = results.map((r) => ({
        productId: r.id,
        name: r.name,
        brand: r.brand,
        price: r.price,
        originalPrice: r.originalPrice || r.price,
        discount: r.discount || 0,
        rating: r.rating || 0,
        source: r.offers?.[0]?.source || "Online Retailer",
        image: r.image,
        link: r.offers?.[0]?.link || "#",
        currencySymbol: symbol,
        logoUrl: r.offers?.[0]?.logoUrl || "",
        offers: r.offers || [],
      }));

      // Return both minified results for LLM prompt and full results for UI citations
      const llmResults = mappedResults.slice(0, 5).map((r) => ({
        productId: r.productId,
        name: r.name,
        brand: r.brand,
        price: r.price,
        originalPrice: r.originalPrice,
        discount: r.discount,
        rating: r.rating,
        source: r.source,
      }));

      return JSON.stringify({
        llmResults,
        citations: mappedResults.slice(0, 5),
      });
    } catch (err: any) {
      console.error("Error inside searchProductsTool:", err);
      return JSON.stringify({ error: "Failed to fetch products" });
    }
  },
  {
    name: "search_products",
    description: "Search for e-commerce products, details, pricing comparisons, and deals by query, category, or country (gl).",
    schema: z.object({
      query: z.string().describe("E-commerce search query, e.g., 'laptop', 'Samsung S24', 'running shoes'"),
      category: z.string().optional().describe("Category filter, e.g., 'mobiles', 'laptops', 'headphones', 'fashion', 'appliances'"),
      gl: z.string().optional().describe("Country code, e.g., 'us' for United States, 'in' for India, 'uk' for United Kingdom"),
    }),
  }
);

// Round-robin key rotation for Google Search Tool
let searchKeyIndex = 0;

async function fetchSerperSearch(query: string): Promise<any> {
  const keysString = process.env.SERP_API_KEYS || "";
  const keys = keysString
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    console.warn("[Serper Search] No keys configured in SERP_API_KEYS.");
    return null;
  }

  for (let i = 0; i < keys.length; i++) {
    const activeKeyIdx = (searchKeyIndex + i) % keys.length;
    const activeKey = keys[activeKeyIdx];
    const maskedKey = `${activeKey.slice(0, 6)}...${activeKey.slice(-4)}`;

    try {
      console.log(`[Serper Search] POST /search q="${query}" key=[${maskedKey}]`);

      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": activeKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query, num: 10 }),
        cache: "no-store",
      });

      if (!res.ok) {
        let body = "";
        try { body = await res.text(); } catch (_) {}
        console.error(`[Serper Search] HTTP ${res.status} key=[${maskedKey}]: ${body.slice(0, 300)}`);
        continue;
      }

      const data = await res.json();
      if (data.error) {
        console.warn(`[Serper Search] API error key=[${maskedKey}]: ${data.error}`);
        continue;
      }

      searchKeyIndex = (activeKeyIdx + 1) % keys.length;
      return data;
    } catch (err) {
      console.error(`[Serper Search] Network error key=[${maskedKey}]:`, err);
    }
  }

  return null;
}

const googleSearchTool = tool(
  async ({ query }) => {
    try {
      const results = await fetchSerperSearch(query);
      if (!results || !results.organic) {
        return JSON.stringify({ error: "No search results found" });
      }

      // Format organic results compactly for the LLM
      const llmSearchOutput = results.organic.slice(0, 5).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

      // Map to ChatCitation shape for frontend rendering and DB persistence
      const mappedCitations: ChatCitation[] = results.organic.slice(0, 5).map((item: any, idx: number) => {
        let domain = "Web Link";
        try {
          const urlObj = new URL(item.link);
          domain = urlObj.hostname.replace("www.", "");
        } catch {}

        return {
          productId: `google-search-${encodeURIComponent(item.title).slice(0, 50)}-${idx}`,
          name: item.title,
          brand: "Search Result",
          price: 0,
          originalPrice: 0,
          discount: 0,
          rating: 0,
          source: domain,
          image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=200", // Sleek tech BG
          link: item.link,
          logoUrl: `https://www.google.com/s2/favicons?domain=${item.link}&sz=64`,
        };
      });

      return JSON.stringify({
        llmResults: llmSearchOutput,
        citations: mappedCitations,
      });
    } catch (err: any) {
      console.error("Error inside googleSearchTool:", err);
      return JSON.stringify({ error: "Failed to query Google search" });
    }
  },
  {
    name: "google_search",
    description: "Search Google for general information, current events, tech reviews, spec comparisons, dates, or non-shopping queries. Use this when the query is informational and cannot be answered directly.",
    schema: z.object({
      query: z.string().describe("The search query to look up on Google, e.g. 'best phone in 2026', 'current weather in Tokyo', 'iPhone 16 vs Galaxy S24 comparison'"),
    }),
  }
);

// Map of tools for execution
const toolsByName = {
  search_products: searchProductsTool,
  google_search: googleSearchTool,
};

// 3. Define StateGraph Nodes

// Model Node: Invokes Groq LLM using structured JSON routing (no bindTools)
async function callModel(state: typeof ChatStateAnnotation.State) {
  const currentDateTime = new Date().toLocaleString("en-US", { timeZoneName: "short" });
  const gl = state.userContext?.currentRegion || "us";
  const currencySymbol = countryCurrencyMap[gl.toLowerCase()] || "$";
  const countryName = gl.toUpperCase() === "IN" ? "India" : gl.toUpperCase();
  
  // Check if the last message is a ToolMessage — if so, this is the "final response" phase
  const lastMsg = state.messages[state.messages.length - 1];
  const isAfterToolCall = lastMsg && lastMsg._getType() === "tool";

  let systemPromptContent: string;

  if (isAfterToolCall) {
    // ── FINAL RESPONSE PHASE ──
    // The model has already received tool results. Now it must produce a clean Markdown answer.
    systemPromptContent =
      `You are Trendify AI, a premium real-time e-commerce price comparator assistant.\n` +
      `Current Date and Time: ${currentDateTime}.\n` +
      `Active Region: ${countryName} (${gl.toUpperCase()}) · Currency: ${currencySymbol}\n\n` +
      `You have just received real data from a search tool. Your job now is to write a clear, helpful, well-formatted response to the user based ONLY on that data.\n\n` +
      `RESPONSE RULES:\n` +
      `- Respond in clean Markdown: use headers (##), bullet lists, bold text, and tables where appropriate.\n` +
      `- IMPORTANT: You MUST display all prices in the local currency of the active region: ${currencySymbol} (e.g. if the active region is IN, use ₹). Do NOT convert or change the raw numbers from the tool results; simply display them as-is with the ${currencySymbol} symbol (e.g., if the price is 17599, display it as ${currencySymbol}17,599).\n` +
      `- Do NOT hallucinate prices, ratings, or specs not present in the tool results.\n` +
      `- If the tool returned an error or no results, say so honestly.\n` +
      `- Do NOT output any JSON objects, XML tags, or function call syntax.\n` +
      `- Do NOT use any emojis or emoticons.\n` +
      `- Keep branding as text 'Trendify AI'.\n\n` +
      `FOLLOW-UP SUGGESTIONS: At the very end of your response, append exactly this HTML comment with 2-3 follow-up suggestion strings:\n` +
      `<!-- suggestions: ["Suggestion 1", "Suggestion 2", "Suggestion 3"] -->`;
  } else {
    // ── TOOL ROUTING PHASE ──
    // The model must decide: respond directly, OR output a JSON tool call object.
    const gl = state.userContext?.currentRegion || "us";
    systemPromptContent =
      `You are Trendify AI, a premium real-time e-commerce price comparator assistant.\n` +
      `Current Date and Time: ${currentDateTime}.\n` +
      `You help users find deals, compare prices, read reviews, and answer general queries.\n\n` +
      `== AVAILABLE TOOLS ==\n` +
      `1. search_products — Search for e-commerce products, prices, and deals.\n` +
      `   Args: { "query": string, "category"?: string, "gl"?: string (country code, default "${gl}") }\n` +
      `2. google_search — Search Google for reviews, specs, news, general info.\n` +
      `   Args: { "query": string }\n\n` +
      `== HOW TO CALL A TOOL ==\n` +
      `When you need to look something up, your ENTIRE response must be ONLY the JSON object below — no other words before or after it.\n` +
      `WRONG: "I will search for this. {\"action\":\"google_search\",...}"\n` +
      `RIGHT: {\"action\":\"google_search\",\"args\":{\"query\":\"Moto Edge 50 Fusion reviews 2024\"}}\n` +
      `RIGHT: {\"action\":\"search_products\",\"args\":{\"query\":\"Moto Edge 50 Fusion\",\"gl\":\"${gl}\"}}\n\n` +
      `RULE: If you output ANYTHING other than a raw JSON object when calling a tool, the system will break. Output JSON and ONLY JSON.\n\n` +
      `== MANDATORY TOOL CALL TRIGGER RULES ==\n` +
      `- You MUST call search_products if the query contains ANY product names, brands (e.g. Motorola, Apple, Samsung, Nike), product category (e.g. phones, shoes, laptops), or shopping-intent words (e.g. "deals", "buy", "find", "search", "show me"). Never list products from your own training memory without calling this tool.\n` +
      `- You MUST call google_search if the query is asking for reviews, spec comparisons (e.g. "X vs Y"), weather, news, release dates, or general informational questions.\n` +
      `- You may ONLY respond directly (without tools) for: greetings (e.g. "hi", "hello"), friendly casual chit-chat, or explaining your own capabilities. For any e-commerce query, search query, or product mention, YOU MUST CHOOSE A TOOL and output ONLY the JSON object.\n\n` +
      `== ANTI-HALLUCINATION ==\n` +
      `- Never fabricate product prices, specs, ratings, or reviews.\n` +
      `- If unsure, call google_search to verify.\n` +
      `- Do NOT output XML, function tags, or <function=...> syntax ever.\n` +
      `- Do NOT use emojis.\n\n` +
      `FOLLOW-UP SUGGESTIONS: At the very end of every DIRECT (non-tool-call) response, append:\n` +
      `<!-- suggestions: ["Suggestion 1", "Suggestion 2"] -->`;

    const userContext = state.userContext;
    if (userContext) {
      systemPromptContent += "\n\n=== USER CONTEXT ===\n";
      if (userContext.email) systemPromptContent += `Email: ${userContext.email}\n`;
      if (userContext.country) systemPromptContent += `Home Region: ${userContext.country.toUpperCase()}\n`;
      if (userContext.currentRegion) systemPromptContent += `Current Region (gl): ${userContext.currentRegion.toUpperCase()}\n`;
      if (userContext.categories?.length > 0) systemPromptContent += `Preferred Categories: ${userContext.categories.join(", ")}\n`;
      if (userContext.brands?.length > 0) systemPromptContent += `Preferred Brands: ${userContext.brands.join(", ")}\n`;
      if (userContext.watchlist?.length > 0) {
        systemPromptContent += "Watchlist:\n";
        userContext.watchlist.forEach((w: any, i: number) => {
          systemPromptContent += `  ${i + 1}. ${w.productBrand} ${w.productName} — Price: ${w.productPrice}\n`;
        });
      }
      systemPromptContent += `\nIMPORTANT: When searching for products, always include "gl": "${gl}" in your search_products args.`;
    }
  }

  const systemMessage = new SystemMessage(systemPromptContent);

  const keysCount = groqKeyManager.getKeysCount();
  const maxAttempts = Math.max(1, keysCount);
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Use plain chat model — NO bindTools() to avoid Groq tool validation errors
      const chatModel = groqKeyManager.createChatModel(isAfterToolCall ? 0.5 : 0.0, state.selectedModel);

      console.log(`[Agent] Invoking LLM (phase=${isAfterToolCall ? "final" : "routing"}, msgs=${state.messages.length})`);
      const response = await chatModel.invoke([systemMessage, ...state.messages]);

      const rawContent = typeof response.content === "string"
        ? response.content.trim()
        : JSON.stringify(response.content || "");

      console.log(`[Agent] Raw response preview: ${rawContent.slice(0, 300)}`);

      // ── Parse tool call JSON from model output ──
      if (!isAfterToolCall) {
        // The model might prepend text like "I will search for..." before the JSON.
        // Robustly scan for ALL {...} blocks in the response and try each one.
        const jsonBlocks: string[] = [];
        let depth = 0, start = -1;
        for (let i = 0; i < rawContent.length; i++) {
          if (rawContent[i] === "{") {
            if (depth === 0) start = i;
            depth++;
          } else if (rawContent[i] === "}") {
            depth--;
            if (depth === 0 && start !== -1) {
              jsonBlocks.push(rawContent.slice(start, i + 1));
              start = -1;
            }
          }
        }

        // Try each extracted JSON block (last one wins — it's usually the tool call)
        for (const block of [...jsonBlocks].reverse()) {
          try {
            const parsed = JSON.parse(block);
            if (
              parsed.action &&
              parsed.args &&
              (parsed.action === "search_products" || parsed.action === "google_search")
            ) {
              console.log(`[Agent] Detected tool call: action=${parsed.action} args=${JSON.stringify(parsed.args)}`);
              const toolCallMsg = new AIMessage({
                content: "",
                tool_calls: [
                  {
                    name: parsed.action,
                    args: parsed.args,
                    id: `call_${Date.now()}`,
                    type: "tool_call",
                  },
                ],
              });
              return { messages: [toolCallMsg] };
            }
          } catch {
            // Not a valid tool call JSON block — try the next one
          }
        }
        console.log("[Agent] No tool call JSON found — treating as direct text response");
      }


      // Regular text response — return as-is
      return { messages: [response] };

    } catch (err: any) {
      console.error(`[Groq Rotation] Attempt ${attempt}/${maxAttempts} failed:`, err.message || err);
      lastError = err;
      if (attempt === maxAttempts) throw err;
      console.log("[Groq Rotation] Retrying next API key...");
    }
  }

  throw lastError || new Error("Failed to invoke Groq model after multiple retries");
}

// Tool Node: Executes tool calls and extracts citations to the state
async function callTools(state: typeof ChatStateAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  const newCitations: ChatCitation[] = [];
  const toolMessages: ToolMessage[] = [];

  if (lastMessage && "tool_calls" in lastMessage && Array.isArray((lastMessage as any).tool_calls)) {
    for (const toolCall of (lastMessage as any).tool_calls) {
      if (toolCall.name === "search_products") {
        const activeGl = state.userContext?.currentRegion || "us";
        toolCall.args.gl = activeGl;
        console.log(`[Agent] Enforcing gl="${activeGl}" for search_products tool call`);
      }

      const toolInstance = (toolsByName as any)[toolCall.name];
      if (toolInstance) {
        try {
          const rawResult = await toolInstance.invoke(toolCall);
          
          // Extract string content and citations for UI
          let contentStr = "";
          let citationsForUi: ChatCitation[] = [];

          if (typeof rawResult === "string") {
            try {
              const parsed = JSON.parse(rawResult);
              if (parsed && typeof parsed === "object" && "llmResults" in parsed && "citations" in parsed) {
                contentStr = JSON.stringify(parsed.llmResults);
                citationsForUi = parsed.citations;
              } else {
                contentStr = rawResult;
              }
            } catch {
              contentStr = rawResult;
            }
          } else if (rawResult && typeof rawResult === "object" && "content" in rawResult) {
            const rawContent = (rawResult as any).content;
            const contentVal = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
            try {
              const parsed = JSON.parse(contentVal);
              if (parsed && typeof parsed === "object" && "llmResults" in parsed && "citations" in parsed) {
                contentStr = JSON.stringify(parsed.llmResults);
                citationsForUi = parsed.citations;
              } else {
                contentStr = contentVal;
              }
            } catch {
              contentStr = contentVal;
            }
          } else {
            contentStr = JSON.stringify(rawResult);
          }

          if (citationsForUi && citationsForUi.length > 0) {
            newCitations.push(...citationsForUi);
          } else if (toolCall.name === "search_products") {
            // Fallback parsing if shape was simple array
            try {
              const parsed = JSON.parse(contentStr);
              if (Array.isArray(parsed)) {
                newCitations.push(...parsed);
              }
            } catch (e) {
              console.error("Failed to parse search tool result as JSON citations:", e);
            }
          }

          // Append ToolMessage to keep track in messages history
          toolMessages.push(new ToolMessage({
            content: contentStr,
            tool_call_id: toolCall.id,
            name: toolCall.name,
          }));
        } catch (err: any) {
          toolMessages.push(new ToolMessage({
            content: JSON.stringify({ error: err.message }),
            tool_call_id: toolCall.id,
            name: toolCall.name,
          }));
        }
      }
    }
  }

  return {
    messages: toolMessages,
    citations: newCitations,
  };
}

// Routing Function: Checks if the model wants to call tools or end
function shouldContinue(state: typeof ChatStateAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  if (lastMessage && "tool_calls" in lastMessage && Array.isArray((lastMessage as any).tool_calls) && (lastMessage as any).tool_calls.length > 0) {
    return "tools";
  }
  return END;
}

// 4. Create and compile the StateGraph
const workflow = new StateGraph(ChatStateAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", callTools)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END,
  })
  .addEdge("tools", "agent");

export const langgraphAgent = workflow.compile();

/**
 * Runs the LangGraph agent for a user prompt, returning the assistant response, updated messages, and citations.
 */
export async function runChatAgent(
  history: BaseMessage[],
  newPrompt: string,
  userContext?: any,
  model?: string
): Promise<{
  content: string;
  citations: ChatCitation[];
  fullHistory: BaseMessage[];
  contextExceeded: boolean;
}> {
  // Check context window length guardrail (e.g., 40 messages maximum)
  const CONTEXT_LIMIT = 40;
  if (history.length >= CONTEXT_LIMIT) {
    return {
      content: "",
      citations: [],
      fullHistory: history,
      contextExceeded: true,
    };
  }

  // Create state input with prompt
  const inputState = {
    messages: [...history, new HumanMessage({ content: newPrompt })],
    citations: [],
    contextExceeded: false,
    userContext: userContext || null,
    selectedModel: model || "llama-3.3-70b-versatile",
  };

  // Run the compiled LangGraph graph with recursion limit to prevent loops
  const resultState = await langgraphAgent.invoke(inputState, { recursionLimit: 5 });

  // resultState.messages contains the complete message history (inputState.messages + new messages added).
  const fullHistory = resultState.messages;

  // Extract the final assistant reply (last message of the full history)
  const lastMessage = fullHistory[fullHistory.length - 1] as AIMessage;
  let content = typeof lastMessage.content === "string"
    ? lastMessage.content
    : JSON.stringify(lastMessage.content);

  console.log(`[Agent] fullHistory length: ${fullHistory.length}, last role: ${lastMessage._getType()}, content len: ${content.length}`);
  console.log(`[Agent] content preview: ${content.slice(0, 300)}`);

  // Guard against empty/silent responses
  if (!content || content.trim() === "" || content === "null" || content === "undefined") {
    console.warn("[Agent] Empty content detected — returning fallback message");
    content = "I apologize, I was unable to process your request. Please try again or rephrase your question.";
  }

  // Check if history is now exceeding context limit for subsequent calls
  const isNowExceeded = fullHistory.length >= CONTEXT_LIMIT;

  return {
    content,
    citations: resultState.citations,
    fullHistory,
    contextExceeded: isNowExceeded,
  };
}
