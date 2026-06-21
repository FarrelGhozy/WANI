import type { Response } from "express"

export function sendResponse(
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown,
): void {
  res.status(statusCode).json({
    status: statusCode >= 400 ? "failure" : "success",
    message,
    data: data ?? null,
  })
}
