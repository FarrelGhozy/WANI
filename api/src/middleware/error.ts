import type { Request, Response, NextFunction } from "express";
import { AppError } from "@/utils/errors";
import { sendResponse } from "@/utils/response";
import { logger } from "@/config/logger";
import { env } from "@/config/env";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendResponse(
      res,
      err.statusCode,
      err.message,
      env.nodeEnv === "development" ? err.details : undefined
    );
    return;
  }

  logger.error(err);

  const data = env.nodeEnv === "development" ? { stack: err.stack } : undefined;

  sendResponse(res, 500, "internal server error", data);
}
