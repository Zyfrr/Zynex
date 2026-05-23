type ZyNexLogPayload = {
  requestId: string;
  conversationId: string;
  provider: string;
  model: string;
  latencyMs: number;
  status: "SUCCESS" | "ERROR";
  inputPreview: string;
  outputPreview?: string;
};

export class LLMLogger {
  async capture(payload: ZyNexLogPayload) {
    return {
      ...payload,
      capturedAt: new Date().toISOString(),
      delivery: "ASYNC_INGESTION_PLACEHOLDER"
    };
  }
}
