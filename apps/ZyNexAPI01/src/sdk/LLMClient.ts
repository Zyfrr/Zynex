export type ZyNexProviderName = "Claude" | "OpenAI" | "Gemini" | "OpenRouter" | "Groq";

export type ZyNexLLMRequest = {
  requestId: string;
  conversationId: string;
  provider: ZyNexProviderName;
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

export type ZyNexLLMResult = {
  content: string;
  promptTokens: number;
  completionTokens: number;
};

export interface LLMClient {
  stream(request: ZyNexLLMRequest): AsyncIterable<string>;
  complete(request: ZyNexLLMRequest): Promise<ZyNexLLMResult>;
}
