import { env } from "../config/env";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient";

export class OpenRouterClient extends OpenAICompatibleClient {
  constructor(apiKey = env.OPENROUTER_API_KEY) {
    super({
      provider: "OpenRouter",
      apiKey,
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        "HTTP-Referer": "https://zynex.zyfrr.com",
        "X-Title": "ZyNex"
      }
    });
  }
}
