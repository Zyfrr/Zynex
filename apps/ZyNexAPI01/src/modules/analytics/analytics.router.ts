import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/ZyNexAPI01AnalyticsOverview",
  asyncHandler(async (_req, res) => {
    res.json({
      success: true,
      data: {
        totalInferenceCalls: 1428,
        averageLatencyMs: 418,
        p95LatencyMs: 812,
        errorRate: 0.7,
        totalTokens: 284920
      }
    });
  })
);
