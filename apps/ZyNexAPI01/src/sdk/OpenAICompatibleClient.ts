import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/ErrorCodes";
import { LLMClient, ZyNexLLMRequest, ZyNexLLMResult } from "./LLMClient";

type ChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: {
    message?: string;
    code?: string;
  };
};

type OpenAICompatibleClientOptions = {
  provider: string;
  apiKey?: string;
  endpoint: string;
  headers?: Record<string, string>;
};

export class OpenAICompatibleClient implements LLMClient {
  constructor(private readonly options: OpenAICompatibleClientOptions) {}

  async *stream(request: ZyNexLLMRequest): AsyncIterable<string> {
    const result = await this.complete(request);
    const parts = result.content.match(/.{1,32}(\s|$)/g) || [result.content];
    for (const part of parts) {
      yield part.trimEnd();
    }
  }

  async complete(request: ZyNexLLMRequest): Promise<ZyNexLLMResult> {
    if (!this.options.apiKey) {
      throw new AppError(ErrorCode.PROVIDER_UNAVAILABLE, `${this.options.provider} API key is not configured.`, 503, {
        provider: this.options.provider
      });
    }

    const response = await fetch(this.options.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json",
        ...this.options.headers
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: 0.4
      })
    });

    const payload = (await response.json()) as ChatResponse;

    if (!response.ok) {
      throw new AppError(ErrorCode.PROVIDER_UNAVAILABLE, payload.error?.message || `${this.options.provider} request failed.`, response.status, {
        provider: this.options.provider,
        code: payload.error?.code
      });
    }

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new AppError(ErrorCode.PROVIDER_UNAVAILABLE, `${this.options.provider} returned an empty response.`, 502, {
        provider: this.options.provider
      });
    }

    return {
      content,
      promptTokens: payload.usage?.prompt_tokens || estimateTokens(request.messages.map((message) => message.content).join(" ")),
      completionTokens: payload.usage?.completion_tokens || estimateTokens(content)
    };
  }
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.trim().length / 4));
}
