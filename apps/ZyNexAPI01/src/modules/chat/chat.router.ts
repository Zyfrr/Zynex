import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { sendMessageSchema } from "./chat.schema";

export const chatRouter = Router();

chatRouter.post(
  "/Conversations/:ConversationId/Messages",
  asyncHandler(async (req, res) => {
    const body = sendMessageSchema.parse(req.body);
    const conversationId = req.params.ConversationId;

    res.json({
      success: true,
      data: {
        requestId: req.header("x-request-id"),
        conversationId,
        provider: body.provider,
        model: body.model,
        assistantMessage:
          "ZyNex streaming placeholder: the next phase will replace this with SSE provider output."
      }
    });
  })
);
