import type {
  PipelineInput,
  PipelineResult,
  ChatMessage,
  LLMOutput,
  StoreInfo,
  ProductEntry,
  CompletionResult,
} from "@/src/types/ai"
import type { TraceContext } from "@/src/debug/tracer"
import type { Either } from "./either"

// ── Error ───────────────────────────────────────────────

export type StepError =
  | { type: "short_circuit"; reply: string; intent: string }
  | { type: "internal"; message: string }

// ── Step trait ──────────────────────────────────────────

export interface Step<I, O> {
  name: string
  run(i: I, ctx: { trace: TraceContext }): Promise<Either<StepError, O>>
}

// ── Pipeline state types (one per stage) ────────────────

/** After step 1 (normalize). */
export interface NormalizedInput {
  ownerId: string
  phone: string
  name?: string
  waMsgId?: string
  text: string
  normalized: string
}

/** After steps 2–8 (ensure customer → security clear). */
export interface ClearedInput extends NormalizedInput {
  customerId: string
  customerPhone: string
  conversationId: string
}

/** After step 9 (context loader). */
export interface EnrichedInput extends ClearedInput {
  storeInfo: StoreInfo
  products: ProductEntry[]
  aiConfig: Record<string, unknown>
}

/** After step 10 (message builder). */
export interface PromptInput extends EnrichedInput {
  systemPrompt: string
  historyMessages: ChatMessage[]
}

/** After step 11 (LLM call). */
export interface LlmInput extends PromptInput {
  completion: CompletionResult
}

/** After step 12 (output parse). */
export interface ParsedInput extends LlmInput {
  llmOutput: LLMOutput
  llmIntent: string
}

/** After step 13 (intent executor). */
export interface ActionInput extends ParsedInput {
  actionReply: string
  qrisImageUrl: string | null
}

/** After step 14 (output guardrails). */
export interface GuardedInput extends ActionInput {
  finalReply: string
}

// ── Error replies ───────────────────────────────────────

export const STEP_REPLIES = {
  FALLBACK: "Maaf, sistem sedang sibuk. Silakan coba lagi sebentar ya.",
  LEAK: "Maaf, terjadi kesalahan teknis. Tim kami akan segera memperbaikinya.",
  INJECTION: "Maaf, pesan Anda tidak dapat diproses. Silakan kirim ulang dengan bahasa yang sopan.",
  BUDGET: "Maaf, lagi ramai. CS manusia akan segera membalas pesan Anda.",
  RATE_LIMIT: "Mohon tunggu sebentar, Anda terlalu cepat mengirim pesan.",
} as const
