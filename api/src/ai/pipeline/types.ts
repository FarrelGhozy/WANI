import type {
  PipelineInput,
  PipelineResult,
  ChatMessage,
  LLMOutput,
  StoreInfo,
  ProductEntry,
  CompletionResult,
} from "@/src/types/ai"
import type { RetrievalResult } from "@/src/types/knowledge"
import { TraceContext } from "@/src/debug/tracer"

/**
 * Mutable context that accumulates state as pipeline steps execute.
 * Each step reads what it needs, writes what it produces.
 * The coordinator passes this through the step chain.
 */
export interface PipelineContext {
  // Provided at start
  input: PipelineInput
  trace: TraceContext

  // Populated by steps (in execution order)
  normalized?: string
  customerId?: string
  customerPhone?: string
  conversationId?: string
  piiTypes?: string[]

  storeInfo?: StoreInfo
  products?: ProductEntry[]
  aiConfig?: Record<string, any>
  knowledgeContext?: RetrievalResult[]

  systemPrompt?: string
  historyMessages?: ChatMessage[]
  completion?: CompletionResult
  llmOutput?: LLMOutput
  actionReply?: string
  actionQrisUrl?: string | null
  finalReply?: string
  llmIntent?: string
}

/**
 * Result of running a single pipeline step.
 * - `continue` → keep executing subsequent steps
 * - `break` → short-circuit the pipeline with a final result
 */
export type StepOutcome =
  | { kind: "continue" }
  | { kind: "break"; result: PipelineResult }

export interface PipelineStep {
  /** Human-readable label for observability. */
  name: string
  run: (ctx: PipelineContext) => Promise<StepOutcome>
}

export const STEP_REPLIES = {
  FALLBACK: "Maaf, sistem sedang sibuk. Silakan coba lagi sebentar ya.",
  LEAK: "Maaf, terjadi kesalahan teknis. Tim kami akan segera memperbaikinya.",
  INJECTION: "Maaf, pesan Anda tidak dapat diproses. Silakan kirim ulang dengan bahasa yang sopan.",
  BUDGET: "Maaf, lagi ramai. CS manusia akan segera membalas pesan Anda.",
  RATE_LIMIT: "Mohon tunggu sebentar, Anda terlalu cepat mengirim pesan.",
} as const
