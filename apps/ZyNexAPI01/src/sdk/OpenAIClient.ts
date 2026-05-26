import { env } from "../config/env";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient";

export class OpenAIClient extends OpenAICompatibleClient {
  constructor(apiKey = env.OPENAI_API_KEY) {
    super({
      provider: "OpenAI",
      apiKey,
      endpoint: "https://api.openai.com/v1/chat/completions"
    });
  }
}
