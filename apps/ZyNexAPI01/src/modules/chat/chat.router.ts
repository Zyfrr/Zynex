import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getUserIdFromRequest } from "../../utils/authRequest";
import { sendMessageSchema } from "./chat.schema";
import { sendChatMessage } from "./chat.service";

export const chatRouter = Router();

chatRouter.post(
  "/ZyNexAPI01ChatConversations/:ConversationId/Messages",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: "AUTH001", message: "Please login again.", details: {} }
      });
    }

    const body = sendMessageSchema.parse(req.body);
    const conversationId = String(req.params.ConversationId);
    const result = await sendChatMessage({
      userId,
      conversationId,
      message: body.message,
      provider: body.provider,
      model: body.model
    });

    res.json({
      success: true,
      data: {
        requestId: result.requestId,
        conversationId,
        provider: body.provider,
        model: body.model,
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        inferenceLog: {
          id: result.inferenceLog.id,
          latencyMs: result.inferenceLog.latencyMs,
          promptTokens: result.inferenceLog.promptTokens,
          completionTokens: result.inferenceLog.completionTokens,
          totalTokens: result.inferenceLog.totalTokens,
          status: result.inferenceLog.status
        }
      }
    });
  })
);
