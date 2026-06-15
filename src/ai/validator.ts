import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { LLMOutputSchema } from './schemas.js';
import type { LLMOutput, ValidationResult } from '../types/index.js';

// ─── Constants ────────────────────────────────────────────

const MAX_RETRIES = 2;

// ─── Error subclass ───────────────────────────────────────

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ─── Product Lookup ───────────────────────────────────────

interface ValidatedItem {
  productId: string;
  qty: number;
}

/**
 * Check that item names exist in the merchant's product catalog.
 * Returns resolved product IDs and lists of unknown/missing names.
 */
async function resolveProducts(
  merchantId: string,
  items: Array<{ name: string; qty: number }>,
): Promise<{
  validItems: ValidatedItem[];
  errors: string[];
}> {
  const names = [...new Set(items.map((i) => i.name.toLowerCase().trim()))];

  const products = await prisma.product.findMany({
    where: {
      merchantId,
      isAvailable: true,
      OR: names.map((n) => ({
        name: { contains: n, mode: 'insensitive' as const },
      })),
    },
    select: { id: true, name: true, stock: true, isAvailable: true },
  });

  const errors: string[] = [];
  const validItems: ValidatedItem[] = [];

  for (const item of items) {
    const match = products.find(
      (p) => p.name.toLowerCase().trim() === item.name.toLowerCase().trim(),
    ) as { id: string; name: string; stock: number; isAvailable: boolean } | undefined;

    if (!match) {
      errors.push(`Product not found: "${item.name}"`);
      continue;
    }

    if (!match.isAvailable) {
      errors.push(`Product "${item.name}" is currently unavailable`);
      continue;
    }

    if (match.stock < item.qty) {
      errors.push(
        `Insufficient stock for "${item.name}": requested ${item.qty}, available ${match.stock}`,
      );
      continue;
    }

    validItems.push({ productId: match.id, qty: item.qty });
  }

  return { validItems, errors };
}

// ─── Main Validator ───────────────────────────────────────

export interface ValidateOptions {
  /** Merchant ID for product lookup (required if intent is 'order') */
  merchantId?: string;
  /** Attempt number (0-based), used internally for retry tracking */
  attempt?: number;
}

export interface ValidateResult {
  /** Parsed and validated LLM output, or null if validation failed */
  data: LLMOutput | null;
  /** Validation result with error messages */
  validation: ValidationResult;
  /** Whether a retry is possible (>0 means more retries left) */
  retriesLeft: number;
  /** If intent is 'order', the resolved product IDs mapped to quantities */
  resolvedItems?: ValidatedItem[];
}

/**
 * Validate a raw LLM output string against the expected schema.
 * For 'order' intents, also checks that products exist in the merchant's DB.
 *
 * @param content    - Raw JSON string from the LLM
 * @param options    - Validation options (merchantId, attempt)
 * @returns A ValidateResult containing parsed data, errors, and retry info
 */
export async function validateLLMOutput(
  content: string,
  options: ValidateOptions = {},
): Promise<ValidateResult> {
  const attempt = options.attempt ?? 0;
  const retriesLeft = Math.max(0, MAX_RETRIES - attempt);

  // 1. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      data: null,
      validation: {
        valid: false,
        errors: ['Failed to parse LLM output as JSON'],
      },
      retriesLeft,
    };
  }

  // 2. Validate against Zod schema
  const schemaResult = LLMOutputSchema.safeParse(parsed);

  if (!schemaResult.success) {
    const zodErrors = schemaResult.error.issues.map(
      (issue) => `Field "${issue.path.join('.')}": ${issue.message}`,
    );

    return {
      data: null,
      validation: {
        valid: false,
        errors: zodErrors,
      },
      retriesLeft,
    };
  }

  const data: LLMOutput = schemaResult.data;

  // 3. For order intents, resolve products in DB
  if (data.intent === 'order' && options.merchantId) {
    const { validItems, errors } = await resolveProducts(
      options.merchantId,
      data.items,
    );

    if (errors.length > 0) {
      logger.warn({ errors, merchantId: options.merchantId }, 'Product validation failed');
      return {
        data,
        validation: {
          valid: false,
          errors,
        },
        retriesLeft,
        resolvedItems: validItems,
      };
    }

    return {
      data,
      validation: { valid: true, errors: [] },
      retriesLeft,
      resolvedItems: validItems,
    };
  }

  return {
    data,
    validation: { valid: true, errors: [] },
    retriesLeft,
  };
}

/**
 * Full validation pipeline: validates LLM output and retries with error feedback
 * up to MAX_RETRIES times.
 *
 * @param getContent  - Async function that calls the LLM with a system prompt suffix
 * @param merchantId  - Merchant ID for product DB lookup
 * @returns The validated LLMOutput
 * @throws ValidationError if all retries are exhausted
 */
export async function validateWithRetry(
  getContent: (errorFeedback: string | null) => Promise<string>,
  merchantId?: string,
): Promise<{ data: LLMOutput; resolvedItems?: ValidatedItem[] }> {
  let errorFeedback: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const content = await getContent(errorFeedback);
    const result = await validateLLMOutput(content, {
      merchantId,
      attempt,
    });

    if (result.validation.valid && result.data) {
      logger.info({ attempt, intent: result.data.intent }, 'LLM output validated');
      return {
        data: result.data,
        resolvedItems: result.resolvedItems,
      };
    }

    // If no retries left, throw
    if (result.retriesLeft <= 0) {
      const errors = result.validation.errors.join('; ');
      throw new ValidationError(
        `LLM output validation failed after ${MAX_RETRIES + 1} attempt(s): ${errors}`,
        false,
      );
    }

    // Build error feedback for the next attempt
    errorFeedback = [
      'Your previous response failed validation. Please fix the following errors and respond again with valid JSON only:',
      ...result.validation.errors.map((e) => `- ${e}`),
      '',
      'Return ONLY the corrected JSON object. No markdown, no extra text.',
    ].join('\n');

    logger.warn(
      { attempt, errors: result.validation.errors },
      'LLM output validation failed, retrying with feedback',
    );
  }

  throw new ValidationError('Unexpected exit from validation retry loop', false);
}

// Re-export product validation for external use
export { resolveProducts };
export type { ValidatedItem };
