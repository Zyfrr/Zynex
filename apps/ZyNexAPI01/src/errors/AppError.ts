import { ErrorCode } from "./ErrorCodes";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode = 500,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
  }
}
