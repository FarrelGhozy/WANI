export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class BadRequestError extends AppError {
  constructor(message = "bad request", details?: unknown) {
    super(message, 400, details)
    this.name = "BadRequestError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "unauthorized", details?: unknown) {
    super(message, 401, details)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "forbidden", details?: unknown) {
    super(message, 403, details)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends AppError {
  constructor(message = "not found", details?: unknown) {
    super(message, 404, details)
    this.name = "NotFoundError"
  }
}

export class InternalServerError extends AppError {
  constructor(message = "internal server error", details?: unknown) {
    super(message, 500, details)
    this.name = "InternalServerError"
  }
}
