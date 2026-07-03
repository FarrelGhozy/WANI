import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { BadRequestError, InternalServerError } from "@/src/utils/errors";

interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export function getValidatedQuery<T>(req: Request): T {
  if (!req.validatedQuery) {
    throw new InternalServerError("validatedQuery missing — validate middleware required")
  }
  return req.validatedQuery as unknown as T
}

export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (schemas.body) {
      const result = await schemas.body.safeParseAsync(req.body);
      if (!result.success) throw new BadRequestError("validation failed", result.error.issues);
      req.body = result.data as Record<string, unknown>;
    }
    if (schemas.query) {
      const result = await schemas.query.safeParseAsync(req.query);
      if (!result.success) throw new BadRequestError("validation failed", result.error.issues);
      req.validatedQuery = result.data as Record<string, unknown>;
      Object.assign(req.query, result.data);
    }
    if (schemas.params) {
      const result = await schemas.params.safeParseAsync(req.params);
      if (!result.success) throw new BadRequestError("validation failed", result.error.issues);
      req.validatedParams = result.data as Record<string, string>;
      Object.assign(req.params, result.data);
    }
    next();
  };
}
