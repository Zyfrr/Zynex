import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { ErrorCode } from "../errors/ErrorCodes";

export function errorHandlerMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = req.header("x-request-id") || "ZyNexReqUnknown";

  req.log?.error({ err: error, requestId }, "ZyNex API request failed");

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
        timestamp: new Date().toISOString()
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "Unexpected ZyNex API error",
      details: {},
      requestId,
      timestamp: new Date().toISOString()
    }
  });
}
