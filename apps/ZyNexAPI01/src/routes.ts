import { Router } from "express";
import { analyticsRouter } from "@/modules/analytics/analytics.router";
import { authRouter } from "@/modules/auth/auth.router";
import { chatRouter } from "@/modules/chat/chat.router";
import { conversationsRouter } from "@/modules/conversations/conversations.router";
import { ingestionRouter } from "@/modules/ingestion/ingestion.router";

export const routes = Router();

routes.use("/ZyNexAPI01/Auth", authRouter);
routes.use("/ZyNexAPI01/Chat", chatRouter);
routes.use("/ZyNexAPI01/Conversations", conversationsRouter);
routes.use("/ZyNexAPI01/Ingestion", ingestionRouter);
routes.use("/ZyNexAPI01/Analytics", analyticsRouter);
