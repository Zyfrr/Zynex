import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z.string().min(1),
  provider: z.enum(["Claude", "OpenAI", "Gemini", "OpenRouter", "Groq"]).default("Groq"),
  model: z.string().default("llama-3.3-70b-versatile"),
  stream: z.boolean().optional().default(false)
});
