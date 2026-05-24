import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { errorHandlerMiddleware } from "@/middleware/errorHandler.middleware";
import { requestIdMiddleware } from "@/middleware/requestId.middleware";
import { routes } from "@/routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestIdMiddleware);
  app.use(pinoHttp());
  app.use(routes);
  app.use(errorHandlerMiddleware);

  return app;
}
