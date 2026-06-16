/**
 * AI / LLM Engine Module
 *
 * Provides:
 * - `engine`     — OpenRouter API client with retry + fallback model support
 * - `prompts`    — System prompt builder for intent classification
 * - `schemas`    — Zod schemas for LLM output validation
 * - `validator`  — LLM output validation, product DB checks, retry pipeline
 */

export { complete, chat } from './engine.js';
export type { ChatMessage, CompletionOptions, CompletionResult } from './engine.js';

export { buildSystemPrompt } from './prompts.js';
export type { MerchantInfo, ProductEntry } from './prompts.js';

export {
  LLMOutputSchema,
  OrderItemInputSchema,
} from './schemas.js';
export type { LLMOutputSchemaType } from './schemas.js';

export {
  validateLLMOutput,
  validateWithRetry,
  ValidationError,
  resolveProducts,
} from './validator.js';
export type {
  ValidateOptions,
  ValidateResult,
  ValidatedItem,
} from './validator.js';
