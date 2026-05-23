import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z.string().min(1),
  provider: z.enum(["Claude", "OpenAI", "Gemini"]).default("Claude"),
  model: z.string().default("ClaudeSonnet45")
});
