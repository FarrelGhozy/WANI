import { z } from 'zod';

// ─── Order Item ───────────────────────────────────────────

export const OrderItemInputSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  qty: z.number().int().positive('Quantity must be positive'),
});

// ─── Per-intent schemas ───────────────────────────────────

const OrderIntentSchema = z.object({
  intent: z.literal('order'),
  items: z.array(OrderItemInputSchema).min(1, 'At least one item is required'),
  notes: z.string().optional(),
});

const InquiryIntentSchema = z.object({
  intent: z.literal('inquiry'),
  query: z.string().min(1, 'Query is required'),
});

const GreetingIntentSchema = z.object({
  intent: z.literal('greeting'),
  reply: z.string().min(1, 'Reply is required'),
});

const ComplaintIntentSchema = z.object({
  intent: z.literal('complaint'),
  reply: z.string().min(1, 'Reply is required'),
  escalate: z.boolean(),
});

const UnknownIntentSchema = z.object({
  intent: z.literal('unknown'),
  reply: z.string().min(1, 'Reply is required'),
});

const EscalateIntentSchema = z.object({
  intent: z.literal('escalate'),
  reason: z.string().min(1, 'Reason is required'),
});

// ─── Discriminated Union ──────────────────────────────────

/**
 * Zod schema for the full LLM output discriminated by `intent`.
 * Use `LLMOutputSchema.parse()` to validate, or
 * `LLMOutputSchema.safeParse()` for a result-object.
 */
export const LLMOutputSchema = z.discriminatedUnion('intent', [
  OrderIntentSchema,
  InquiryIntentSchema,
  GreetingIntentSchema,
  ComplaintIntentSchema,
  UnknownIntentSchema,
  EscalateIntentSchema,
]);

// ─── Inferred Types (re-exported for convenience) ─────────

export type LLMOutputSchemaType = z.infer<typeof LLMOutputSchema>;
