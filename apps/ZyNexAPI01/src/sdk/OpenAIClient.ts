import { env } from "../config/env";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient";

export class OpenAIClient extends OpenAICompatibleClient {
  constructor() {
    super({
      provider: "OpenAI",
      apiKey: env.OPENAI_API_KEY,
      endpoint: "https://api.openai.com/v1/chat/completions"
    });
  }
}
