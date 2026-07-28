import type { Request, Response, NextFunction } from "express"
import { AppError } from "@/utils/errors"
import { sendResponse } from "@/utils/response"
import { logger } from "@/config/logger"

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendResponse(res, err.statusCode, err.message, err.details)
    return
  }

  logger.error(err)

  const data =
    process.env.NODE_ENV === "development"
      ? { stack: err.stack }
      : undefined

  sendResponse(res, 500, "internal server error", data)
}
