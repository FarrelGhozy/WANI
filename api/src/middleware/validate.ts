import type { Request, Response, NextFunction } from "express"
import type { ZodType } from "zod"
import { BadRequestError } from "@/src/utils/errors"

interface ValidationSchemas {
  body?: ZodType
  query?: ZodType
  params?: ZodType
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (schemas.body) {
      const result = await schemas.body.safeParseAsync(req.body)
      if (!result.success) throw new BadRequestError("validation failed", result.error.issues)
      req.body = result.data as any
    }
    if (schemas.query) {
      const result = await schemas.query.safeParseAsync(req.query)
      if (!result.success) throw new BadRequestError("validation failed", result.error.issues)
      ;(req as any).validatedQuery = result.data
      Object.assign(req.query, result.data)
    }
    if (schemas.params) {
      const result = await schemas.params.safeParseAsync(req.params)
      if (!result.success) throw new BadRequestError("validation failed", result.error.issues)
      ;(req as any).validatedParams = result.data
      Object.assign(req.params, result.data)
    }
    next()
  }
}
