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
  attachments?: Array<{ name: string; type?: string; size?: number; textPreview?: string }>;
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
  const attachmentContext = buildAttachmentContext(input.attachments || []);
  const userContent = attachmentContext ? `${input.message}\n\n${attachmentContext}` : input.message;

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
          content: [
            "You are ZyNex, a concise AI assistant for an LLM inference logging assessment demo.",
            "Format every response clearly with Markdown. Use headings, short paragraphs, bullet lists, and tables when they improve readability.",
            "When the user asks for a letter, email, notice, policy, report, scorecard, or template, return a polished editable document with logical line breaks and placeholders on separate lines.",
            "For emails, put a Subject line and the email body only in the draft. Keep any brief explanation outside the draft.",
            "For letters, include a short title, date, recipient block, greeting, body paragraphs, closing, and signature block.",
            "For recipes, use a title, short intro, Ingredients, Steps, and Tips sections.",
            "For scorecards and rubrics, prefer Markdown tables with clear columns.",
            "Do not collapse sections into one paragraph. Do not use decorative separator lines, trailing # characters, or + signs as bullets. Use '-' for bullets."
          ].join(" ")
        },
        ...contextMessages,
        { role: "user" as const, content: userContent }
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

function buildAttachmentContext(attachments: Array<{ name: string; type?: string; size?: number; textPreview?: string }>) {
  if (!attachments.length) return "";
  return [
    "Attached document context:",
    ...attachments.map((attachment, index) => [
      `Attachment ${index + 1}: ${attachment.name}`,
      attachment.type ? `Type: ${attachment.type}` : "",
      attachment.size ? `Size: ${attachment.size} bytes` : "",
      attachment.textPreview ? `Extracted text:\n${attachment.textPreview}` : "Extracted text unavailable. Use the filename and user prompt only."
    ].filter(Boolean).join("\n"))
  ].join("\n\n");
}

function deriveTitle(message: string) {
  const title = message.trim().replace(/\s+/g, " ").slice(0, 58);
  return title || "Untitled conversation";
}
