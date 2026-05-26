import { env } from "../config/env";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient";

export class GroqClient extends OpenAICompatibleClient {
  constructor(apiKey = env.GROQ_API_KEY) {
    super({
      provider: "Groq",
      apiKey,
      endpoint: "https://api.groq.com/openai/v1/chat/completions"
    });
  }
}
