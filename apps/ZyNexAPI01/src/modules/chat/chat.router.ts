import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getUserIdFromRequest } from "../../utils/authRequest";
import { sendMessageSchema } from "./chat.schema";
import { sendChatMessage } from "./chat.service";
import { getProviderKey } from "../providerKeys/providerKeys.router";

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
    const headerKey = typeof req.headers["x-zynex-provider-key"] === "string" ? req.headers["x-zynex-provider-key"] : undefined;
    const result = await sendChatMessage({
      userId,
      conversationId,
      message: body.message,
      provider: body.provider,
      model: body.model,
      apiKey: headerKey || await getProviderKey(userId, body.provider)
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

chatRouter.post(
  "/ZyNexAPI01ChatConversations/:ConversationId/MessagesStream",
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
    const headerKey = typeof req.headers["x-zynex-provider-key"] === "string" ? req.headers["x-zynex-provider-key"] : undefined;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    });

    await sendChatMessage({
      userId,
      conversationId,
      message: body.message,
      provider: body.provider,
      model: body.model,
      apiKey: headerKey || await getProviderKey(userId, body.provider),
      onToken: (token) => {
        res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
      }
    }).then((result) => {
      res.write(`event: done\ndata: ${JSON.stringify({
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
      })}\n\n`);
    }).catch((error) => {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : "Streaming failed", code: "LLM001" })}\n\n`);
    }).finally(() => {
      res.end();
    });
  })
);
