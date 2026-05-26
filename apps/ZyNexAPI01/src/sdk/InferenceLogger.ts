import { prisma } from "../config/database";
import { redactPIIWithEvents } from "./PIIRedactor";

export type InferenceLogInput = {
  requestId: string;
  userId: string;
  conversationId: string;
  messageId?: string;
  provider: string;
  model: string;
  status: "SUCCESS" | "ERROR";
  latencyMs: number;
  timeToFirstTokenMs?: number;
  promptTokens?: number;
  completionTokens?: number;
  input: string;
  output?: string;
  errorCode?: string;
  errorMessage?: string;
};

export class InferenceLogger {
  async capture(input: InferenceLogInput) {
    const redactedInput = redactPIIWithEvents(input.input);
    const redactedOutput = input.output ? redactPIIWithEvents(input.output) : undefined;
    const totalTokens = (input.promptTokens || 0) + (input.completionTokens || 0);

    return prisma.$transaction(async (tx) => {
      const log = await tx.inferenceLog.create({
        data: {
          requestId: input.requestId,
          userId: input.userId,
          conversationId: input.conversationId,
          messageId: input.messageId,
          provider: input.provider,
          model: input.model,
          status: input.status,
          latencyMs: input.latencyMs,
          timeToFirstTokenMs: input.timeToFirstTokenMs,
          promptTokens: input.promptTokens || 0,
          completionTokens: input.completionTokens || 0,
          totalTokens,
          inputPreview: trimPreview(redactedInput.value, 240),
          outputPreview: redactedOutput ? trimPreview(redactedOutput.value, 240) : undefined,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage
        }
      });

      const redactionEvents = [...redactedInput.events, ...(redactedOutput?.events || [])];
      for (const event of redactionEvents) {
        await tx.redactionEvent.create({
          data: {
            inferenceLogId: log.id,
            fieldName: event.fieldName,
            redactionType: event.redactionType,
            count: event.count
          }
        });
      }

      if (input.status === "ERROR") {
        await tx.errorEvent.create({
          data: {
            inferenceLogId: log.id,
            code: input.errorCode || "LLM_ERROR",
            message: input.errorMessage || "LLM request failed",
            provider: input.provider
          }
        });
      }

      return log;
    });
  }
}

function trimPreview(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 3)}...` : value;
}
