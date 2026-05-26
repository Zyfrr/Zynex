import { env } from "../config/env";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient";

export class OpenRouterClient extends OpenAICompatibleClient {
  constructor() {
    super({
      provider: "OpenRouter",
      apiKey: env.OPENROUTER_API_KEY,
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        "HTTP-Referer": "https://zynex.zyfrr.com",
        "X-Title": "ZyNex"
      }
    });
  }
}
