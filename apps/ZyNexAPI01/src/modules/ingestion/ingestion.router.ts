import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { InferenceLogger } from "../../sdk/InferenceLogger";
import { getUserIdFromRequest } from "../../utils/authRequest";
import { inferenceLogSchema } from "./ingestion.schema";

export const ingestionRouter = Router();
const logger = new InferenceLogger();

ingestionRouter.post(
  "/ZyNexAPI01IngestionLogs",
  asyncHandler(async (req, res) => {
    const requestUserId = getUserIdFromRequest(req);
    const log = inferenceLogSchema.parse(req.body);
    const userId = log.userId || requestUserId;
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });

    const stored = await logger.capture({
      requestId: log.requestId,
      userId,
      conversationId: log.conversationId,
      messageId: log.messageId,
      provider: log.provider,
      model: log.model,
      status: log.status,
      latencyMs: log.latencyMs,
      timeToFirstTokenMs: log.timeToFirstTokenMs,
      promptTokens: log.promptTokens,
      completionTokens: log.completionTokens,
      input: log.inputPreview,
      output: log.outputPreview,
      errorCode: log.errorCode,
      errorMessage: log.errorMessage
    });

    res.status(202).json({
      success: true,
      data: {
        accepted: true,
        eventId: stored.id,
        requestId: log.requestId
      }
    });
  })
);
