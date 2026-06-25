declare namespace Express {
  interface Request {
    validatedQuery?: Record<string, unknown>
    validatedParams?: Record<string, string>
    user?: { id: string; email: string; role: string }
  }
}
