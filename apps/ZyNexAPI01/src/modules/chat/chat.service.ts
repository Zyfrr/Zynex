import { randomUUID } from "crypto";
import { prisma } from "../../config/database";
import { AppError } from "../../errors/AppError";
import { ErrorCode } from "../../errors/ErrorCodes";
import { InferenceLogger } from "../../sdk/InferenceLogger";
import { getLLMClient } from "../../sdk/LLMProviderFactory";
import { ZyNexLLMRequest, ZyNexProviderName } from "../../sdk/LLMClient";

const inferenceLogger = new InferenceLogger();

type SendMessageInput = {
  userId: string;
  conversationId: string;
  message: string;
  provider: ZyNexProviderName;
  model: string;
  apiKey?: string;
  onToken?: (token: string) => void;
};

export async function sendChatMessage(input: SendMessageInput) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: input.conversationId, userId: input.userId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 8 } }
  });

  if (!conversation) throw new AppError(ErrorCode.CONVERSATION_NOT_FOUND, "Conversation not found.", 404);
  if (conversation.status === "CANCELLED") throw new AppError(ErrorCode.VALIDATION_FAILED, "Conversation is cancelled.", 409);

  const requestId = `ZyNexReq${Date.now()}${randomUUID().slice(0, 8)}`;
  const startedAt = Date.now();
  const userMessage = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: "USER",
      content: input.message
    }
  });

  const contextMessages = [...conversation.messages]
    .reverse()
    .map((message) => ({ role: message.role.toLowerCase() as "system" | "user" | "assistant", content: message.content }));

  try {
    const llmClient = getLLMClient(input.provider, input.apiKey);
    const request: ZyNexLLMRequest = {
      requestId,
      conversationId: conversation.id,
      provider: input.provider,
      model: input.model,
      messages: [
        {
          role: "system" as const,
          content: "You are ZyNex, a concise AI assistant for an LLM inference logging assessment demo."
        },
        ...contextMessages,
        { role: "user" as const, content: input.message }
      ]
    };
    let result;
    if (input.onToken) {
      let content = "";
      for await (const token of llmClient.stream(request)) {
        content += token;
        input.onToken(token);
      }
      result = {
        content,
        promptTokens: estimateTokens(request.messages.map((message) => message.content).join(" ")),
        completionTokens: estimateTokens(content)
      };
    } else {
      result = await llmClient.complete(request);
    }

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: result.content
      }
    });

    const latencyMs = Date.now() - startedAt;
    const log = await inferenceLogger.capture({
      requestId,
      userId: input.userId,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      provider: input.provider,
      model: input.model,
      status: "SUCCESS",
      latencyMs,
      timeToFirstTokenMs: Math.min(latencyMs, 120),
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      input: input.message,
      output: result.content
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        title: conversation.title || deriveTitle(input.message),
        provider: input.provider,
        model: input.model
      }
    });

    return {
      requestId,
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
      inferenceLog: log
    };
  } catch (error) {
    await inferenceLogger.capture({
      requestId,
      userId: input.userId,
      conversationId: conversation.id,
      messageId: userMessage.id,
      provider: input.provider,
      model: input.model,
      status: "ERROR",
      latencyMs: Date.now() - startedAt,
      input: input.message,
      errorCode: "LLM_ERROR",
      errorMessage: error instanceof Error ? error.message : "LLM request failed"
    });
    throw error;
  }
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.trim().length / 4));
}

function deriveTitle(message: string) {
  const title = message.trim().replace(/\s+/g, " ").slice(0, 58);
  return title || "Untitled conversation";
}
