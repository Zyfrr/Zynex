import { Router } from "express";
import { prisma } from "../../config/database";
import { asyncHandler } from "../../utils/asyncHandler";
import { getUserIdFromRequest } from "../../utils/authRequest";

export const conversationsRouter = Router();
const deletedRetentionDays = 30;

async function purgeExpiredDeletedConversations(userId: string) {
  const cutoff = new Date(Date.now() - deletedRetentionDays * 24 * 60 * 60 * 1000);
  const expired = await prisma.conversation.findMany({
    where: { userId, status: "ARCHIVED", updatedAt: { lt: cutoff } },
    select: { id: true }
  });
  const conversationIds = expired.map((conversation) => conversation.id);
  if (!conversationIds.length) return;
  const logs = await prisma.inferenceLog.findMany({
    where: { conversationId: { in: conversationIds } },
    select: { id: true }
  });
  const logIds = logs.map((log) => log.id);
  if (logIds.length) {
    await prisma.redactionEvent.deleteMany({ where: { inferenceLogId: { in: logIds } } });
    await prisma.errorEvent.deleteMany({ where: { inferenceLogId: { in: logIds } } });
    await prisma.inferenceLog.deleteMany({ where: { id: { in: logIds } } });
  }
  await prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
  await prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } });
}

conversationsRouter.post(
  "/ZyNexAPI01ConversationsCreate",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const provider = typeof req.body?.provider === "string" ? req.body.provider : "Groq";
    const model = typeof req.body?.model === "string" ? req.body.model : "llama-3.3-70b-versatile";
    const title = typeof req.body?.title === "string" ? req.body.title : "New conversation";
    const projectId = typeof req.body?.projectId === "string" ? req.body.projectId : undefined;
    const conversation = await prisma.conversation.create({
      data: { userId, title, provider, model, projectId }
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
    await purgeExpiredDeletedConversations(userId);
    const conversations = await prisma.conversation.findMany({
      where: { userId, status: { not: "ARCHIVED" } },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
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

conversationsRouter.get(
  "/ZyNexAPI01Projects",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const projects = await prisma.project.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
    res.json({ success: true, data: projects });
  })
);

conversationsRouter.post(
  "/ZyNexAPI01Projects",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ success: false, error: { code: "VAL001", message: "Project name is required.", details: {} } });
    const project = await prisma.project.create({ data: { userId, name } });
    res.status(201).json({ success: true, data: project });
  })
);

conversationsRouter.patch(
  "/ZyNexAPI01Conversations/:ConversationId/Pin",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const conversationId = String(req.params.ConversationId);
    const current = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
    if (!current) return res.status(404).json({ success: false, error: { code: "CHAT001", message: "Conversation not found.", details: {} } });
    const conversation = await prisma.conversation.update({ where: { id: conversationId }, data: { pinned: !current.pinned } });
    res.json({ success: true, data: conversation });
  })
);

conversationsRouter.patch(
  "/ZyNexAPI01Conversations/:ConversationId/Project",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const conversationId = String(req.params.ConversationId);
    const projectId = typeof req.body?.projectId === "string" ? req.body.projectId : null;
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
      if (!project) return res.status(404).json({ success: false, error: { code: "VAL001", message: "Project not found.", details: {} } });
    }
    const conversation = await prisma.conversation.updateMany({ where: { id: conversationId, userId }, data: { projectId } });
    if (!conversation.count) return res.status(404).json({ success: false, error: { code: "CHAT001", message: "Conversation not found.", details: {} } });
    res.json({ success: true, data: { id: conversationId, projectId } });
  })
);

conversationsRouter.get(
  "/ZyNexAPI01LikedChats",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const likedChats = await prisma.likedChat.findMany({ where: { userId }, orderBy: { likedAt: "desc" } });
    res.json({ success: true, data: likedChats });
  })
);

conversationsRouter.post(
  "/ZyNexAPI01LikedChats",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const conversationId = typeof req.body?.conversationId === "string" ? req.body.conversationId : "";
    const title = typeof req.body?.title === "string" ? req.body.title : "Untitled conversation";
    const preview = typeof req.body?.preview === "string" ? req.body.preview.slice(0, 500) : "";
    const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
    if (!conversation) return res.status(404).json({ success: false, error: { code: "CHAT001", message: "Conversation not found.", details: {} } });
    const likedChat = await prisma.likedChat.upsert({
      where: { userId_conversationId: { userId, conversationId } },
      update: { title, preview, likedAt: new Date() },
      create: { userId, conversationId, title, preview }
    });
    res.json({ success: true, data: likedChat });
  })
);

conversationsRouter.post(
  "/ZyNexAPI01ResponseFeedback",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    const conversationId = typeof req.body?.conversationId === "string" ? req.body.conversationId : "";
    const content = typeof req.body?.content === "string" ? req.body.content.slice(0, 2000) : "";
    const type = typeof req.body?.type === "string" ? req.body.type : "bad";
    const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, userId } });
    if (!conversation) return res.status(404).json({ success: false, error: { code: "CHAT001", message: "Conversation not found.", details: {} } });
    const feedback = await prisma.responseFeedback.create({ data: { userId, conversationId, content, type } });
    res.status(201).json({ success: true, data: feedback });
  })
);

conversationsRouter.get(
  "/ZyNexAPI01ConversationsDeleted",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });
    await purgeExpiredDeletedConversations(userId);
    const conversations = await prisma.conversation.findMany({
      where: { userId, status: "ARCHIVED" },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        logs: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    res.json({
      success: true,
      data: conversations.map((conversation) => {
        const deletedAt = conversation.deletedAt || conversation.updatedAt;
        const expiresAt = new Date(deletedAt.getTime() + deletedRetentionDays * 24 * 60 * 60 * 1000);
        return {
          id: conversation.id,
          title: conversation.title || "Untitled conversation",
          provider: conversation.provider,
          model: conversation.model,
          deletedAt,
          expiresAt,
          daysRemaining: Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
          lastMessage: conversation.messages[0]?.content || "",
          lastLatencyMs: conversation.logs[0]?.latencyMs || 0
        };
      })
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
      data: { status: "ARCHIVED", deletedAt: new Date() }
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
