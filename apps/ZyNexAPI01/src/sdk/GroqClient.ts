import { env } from "../config/env";
import { OpenAICompatibleClient } from "./OpenAICompatibleClient";

export class GroqClient extends OpenAICompatibleClient {
  constructor() {
    super({
      provider: "Groq",
      apiKey: env.GROQ_API_KEY,
      endpoint: "https://api.groq.com/openai/v1/chat/completions"
    });
  }
}
