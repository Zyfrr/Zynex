import { Router } from "express";
import { prisma } from "../../config/database";
import { asyncHandler } from "../../utils/asyncHandler";
import { getUserIdFromRequest } from "../../utils/authRequest";

export const conversationsRouter = Router();

conversationsRouter.post(
  "/ZyNexAPI01ConversationsCreate",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const provider = typeof req.body?.provider === "string" ? req.body.provider : "Groq";
    const model = typeof req.body?.model === "string" ? req.body.model : "llama-3.3-70b-versatile";
    const title = typeof req.body?.title === "string" ? req.body.title : "New conversation";
    const conversation = await prisma.conversation.create({
      data: { userId, title, provider, model }
    });

    res.status(201).json({
      success: true,
      data: conversation
    });
  })
);

conversationsRouter.get(
  "/ZyNexAPI01ConversationsList",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const conversations = await prisma.conversation.findMany({
      where: { userId, status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 20 },
        logs: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    res.json({
      success: true,
      data: conversations
    });
  })
);

conversationsRouter.patch(
  "/ZyNexAPI01Conversations/:ConversationId/Rename",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const conversationId = String(req.params.ConversationId);
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) return res.status(400).json({ success: false, error: { code: "VAL001", message: "Conversation title is required.", details: {} } });

    const conversation = await prisma.conversation.updateMany({
      where: { id: conversationId, userId },
      data: { title }
    });
    if (!conversation.count) {
      return res.status(404).json({ success: false, error: { code: "CHAT001", message: "Conversation not found.", details: {} } });
    }

    res.json({ success: true, data: { id: conversationId, title } });
  })
);

conversationsRouter.patch(
  "/ZyNexAPI01Conversations/:ConversationId/Delete",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const conversationId = String(req.params.ConversationId);
    const conversation = await prisma.conversation.updateMany({
      where: { id: conversationId, userId },
      data: { status: "ARCHIVED" }
    });
    if (!conversation.count) {
      return res.status(404).json({ success: false, error: { code: "CHAT001", message: "Conversation not found.", details: {} } });
    }

    res.json({ success: true, data: { id: conversationId, status: "ARCHIVED", retentionDays: 30 } });
  })
);

conversationsRouter.patch(
  "/ZyNexAPI01Conversations/:ConversationId/Cancel",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const conversationId = String(req.params.ConversationId);
    const conversation = await prisma.conversation.updateMany({
      where: { id: conversationId, userId },
      data: { status: "CANCELLED" }
    });
    if (!conversation.count) {
      return res.status(404).json({ success: false, error: { code: "CHAT001", message: "Conversation not found.", details: {} } });
    }

    res.json({
      success: true,
      data: { id: conversationId, status: "CANCELLED" }
    });
  })
);
