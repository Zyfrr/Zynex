import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";

export const conversationsRouter = Router();

conversationsRouter.post(
  "/ZyNexAPI01ConversationsCreate",
  asyncHandler(async (_req, res) => {
    res.status(201).json({
      success: true,
      data: {
        id: "ZyNexConversation1001",
        title: "Enterprise discovery roleplay",
        status: "ACTIVE"
      }
    });
  })
);

conversationsRouter.get(
  "/ZyNexAPI01ConversationsList",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: [
        { id: "ZyNexConversation1001", title: "Enterprise discovery roleplay", status: "ACTIVE" },
        { id: "ZyNexConversation1002", title: "Pricing objection coaching", status: "CANCELLED" }
      ]
    });
  })
);

conversationsRouter.patch(
  "/ZyNexAPI01Conversations/:ConversationId/Cancel",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: { id: req.params.ConversationId, status: "CANCELLED" }
    });
  })
);
