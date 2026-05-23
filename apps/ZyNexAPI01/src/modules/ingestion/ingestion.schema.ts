import { z } from "zod";

export const inferenceLogSchema = z.object({
  requestId: z.string().min(1),
  conversationId: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  latencyMs: z.number().int().nonnegative(),
  timeToFirstTokenMs: z.number().int().nonnegative().optional(),
  promptTokens: z.number().int().nonnegative().default(0),
  completionTokens: z.number().int().nonnegative().default(0),
  status: z.enum(["SUCCESS", "ERROR"]),
  inputPreview: z.string().max(240),
  outputPreview: z.string().max(240).optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional()
});
