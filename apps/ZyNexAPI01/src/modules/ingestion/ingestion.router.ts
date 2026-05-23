import { Router } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { inferenceLogSchema } from "./ingestion.schema";

export const ingestionRouter = Router();

ingestionRouter.post(
  "/Logs",
  asyncHandler(async (req, res) => {
    const log = inferenceLogSchema.parse(req.body);

    res.status(202).json({
      success: true,
      data: {
        accepted: true,
        eventId: `ZyNexEvent${Date.now()}`,
        requestId: log.requestId
      }
    });
  })
);
