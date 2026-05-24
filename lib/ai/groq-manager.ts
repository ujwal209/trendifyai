import { ChatGroq } from "@langchain/groq";

class GroqKeyManager {
  private keys: string[] = [];
  private currentIndex: number = 0;

  constructor() {
    this.reloadKeys();
  }

  public reloadKeys() {
    const rawKeys = process.env.GROQ_API_KEYS || "";
    this.keys = rawKeys.split(",").map((k) => k.trim()).filter(Boolean);
    
    // Fallback to single GROQ_API_KEY
    if (this.keys.length === 0 && process.env.GROQ_API_KEY) {
      this.keys = [process.env.GROQ_API_KEY.trim()];
    }
  }

  public getNextKey(): string {
    if (this.keys.length === 0) {
      // Reload keys just in case env was set later
      this.reloadKeys();
    }
    if (this.keys.length === 0) {
      throw new Error(
        "No Groq API keys found. Please set GROQ_API_KEYS (comma separated) or GROQ_API_KEY environment variable."
      );
    }
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }

  /**
   * Generates a new ChatGroq instance using the next rotated API key.
   */
  public createChatModel(temperature = 0.5, modelName?: string): ChatGroq {
    const apiKey = this.getNextKey();
    return new ChatGroq({
      apiKey,
      model: modelName || "llama-3.3-70b-versatile",
      temperature,
      maxRetries: 0,
    });
  }

  /**
   * Returns the number of loaded API keys.
   */
  public getKeysCount(): number {
    if (this.keys.length === 0) {
      this.reloadKeys();
    }
    return this.keys.length;
  }
}

export const groqKeyManager = new GroqKeyManager();
