export const ZyNexProduct = {
  name: "ZyNex",
  apiVersion: "ZyNexAPI01",
  requestPrefix: "ZyNexReq",
  eventPrefix: "ZyNexEvent"
} as const;

export type ConversationStatus = "ACTIVE" | "CANCELLED" | "ARCHIVED";
export type InferenceStatus = "SUCCESS" | "ERROR";
export type ProviderName = "Claude" | "OpenAI" | "Gemini";
