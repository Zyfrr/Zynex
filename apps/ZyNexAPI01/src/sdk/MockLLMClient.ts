import { LLMClient, ZyNexLLMRequest, ZyNexLLMResult } from "./LLMClient";

const providerTone: Record<string, string> = {
  Claude: "I will reason through this carefully and keep the answer structured.",
  OpenAI: "I will keep this practical, direct, and implementation focused.",
  Gemini: "I will compare the options and highlight the useful tradeoffs."
};

export class MockLLMClient implements LLMClient {
  async *stream(request: ZyNexLLMRequest): AsyncIterable<string> {
    const result = await this.complete(request);
    const parts = result.content.match(/.{1,28}(\s|$)/g) || [result.content];
    for (const part of parts) {
      yield part.trimEnd();
    }
  }

  async complete(request: ZyNexLLMRequest): Promise<ZyNexLLMResult> {
    const latestUserMessage = [...request.messages].reverse().find((message) => message.role === "user")?.content || "";
    const contextCount = request.messages.filter((message) => message.role !== "system").length;
    const content = [
      providerTone[request.provider] || providerTone.Claude,
      `You asked: "${trimPreview(latestUserMessage, 180)}"`,
      `Context used: ${Math.min(contextCount, 6)} recent message${contextCount === 1 ? "" : "s"}.`,
      "Assessment trace: this response is generated through the ZyNex LLM wrapper so latency, token estimates, previews, status, and conversation metadata are logged through ingestion."
    ].join("\n\n");

    return {
      content,
      promptTokens: estimateTokens(request.messages.map((message) => message.content).join(" ")),
      completionTokens: estimateTokens(content)
    };
  }
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.trim().length / 4));
}

function trimPreview(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}
