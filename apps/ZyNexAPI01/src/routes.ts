import { Router } from "express";
import { analyticsRouter } from "./modules/analytics/analytics.router";
import { authRouter } from "./modules/auth/auth.router";
import { chatRouter } from "./modules/chat/chat.router";
import { conversationsRouter } from "./modules/conversations/conversations.router";
import { ingestionRouter } from "./modules/ingestion/ingestion.router";

export const routes = Router();

routes.get("/api/v1/health/ZyNexAPI01HealthCheck", (_req, res) => {
  res.json({
    success: true,
    data: {
      service: "ZyNexAPI01",
      status: "OK",
      timestamp: new Date().toISOString()
    }
  });
});

routes.use("/api/v1/auth", authRouter);
routes.use("/api/v1/chat", chatRouter);
routes.use("/api/v1/conversations", conversationsRouter);
routes.use("/api/v1/ingestion", ingestionRouter);
routes.use("/api/v1/analytics", analyticsRouter);
