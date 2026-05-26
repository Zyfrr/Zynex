import { Router } from "express";
import { prisma } from "../../config/database";
import { asyncHandler } from "../../utils/asyncHandler";
import { getUserIdFromRequest } from "../../utils/authRequest";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/ZyNexAPI01AnalyticsOverview",
  asyncHandler(async (req, res) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ success: false, error: { code: "AUTH001", message: "Please login again.", details: {} } });

    const [summary, totalInferenceCalls, errorCalls, providerGroups, recentLogs, conversations] = await Promise.all([
      prisma.inferenceLog.aggregate({
        where: { userId },
        _avg: { latencyMs: true },
        _sum: { totalTokens: true }
      }),
      prisma.inferenceLog.count({ where: { userId } }),
      prisma.inferenceLog.count({ where: { userId, status: "ERROR" } }),
      prisma.inferenceLog.groupBy({
        by: ["provider"],
        where: { userId },
        _count: { provider: true }
      }),
      prisma.inferenceLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8
      }),
      prisma.conversation.count({ where: { userId } })
    ]);

    const latencyValues = recentLogs.map((log) => log.latencyMs).sort((a, b) => a - b);
    const p95Index = latencyValues.length ? Math.ceil(latencyValues.length * 0.95) - 1 : 0;

    res.json({
      success: true,
      data: {
        totalInferenceCalls,
        totalConversations: conversations,
        averageLatencyMs: Math.round(summary._avg.latencyMs || 0),
        p95LatencyMs: latencyValues[p95Index] || 0,
        errorRate: totalInferenceCalls ? Number(((errorCalls / totalInferenceCalls) * 100).toFixed(2)) : 0,
        totalTokens: summary._sum.totalTokens || 0,
        providerMix: providerGroups.map((group) => ({
          name: group.provider,
          value: group._count.provider
        })),
        recentLogs: recentLogs.map((log) => ({
          requestId: log.requestId,
          provider: log.provider,
          model: log.model,
          status: log.status,
          latencyMs: log.latencyMs,
          totalTokens: log.totalTokens,
          createdAt: log.createdAt
        }))
      }
    });
  })
);
