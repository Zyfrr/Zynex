import { env } from "../config/env";
import { LLMClient, ZyNexProviderName } from "./LLMClient";
import { GroqClient } from "./GroqClient";
import { MockLLMClient } from "./MockLLMClient";
import { OpenAIClient } from "./OpenAIClient";
import { OpenRouterClient } from "./OpenRouterClient";

const mockClient = new MockLLMClient();
const openAIClient = new OpenAIClient();
const groqClient = new GroqClient();
const openRouterClient = new OpenRouterClient();

export function getLLMClient(provider: ZyNexProviderName): LLMClient {
  if (provider === "OpenAI" && env.OPENAI_API_KEY) return openAIClient;
  if (provider === "Groq" && env.GROQ_API_KEY) return groqClient;
  if (provider === "OpenRouter" && env.OPENROUTER_API_KEY) return openRouterClient;
  return mockClient;
}
