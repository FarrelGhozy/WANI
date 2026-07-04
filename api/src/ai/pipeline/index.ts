import { TraceContext } from "@/src/debug/tracer"
import type { PipelineInput, PipelineResult } from "@/src/types/ai"
import { runSteps } from "./coordinator"
import { normalizeStep } from "./steps/normalize"
import { ensureCustomerStep } from "./steps/ensureCustomer"
import { dedupStep } from "./steps/dedup"
import { persistInboundStep } from "./steps/persistInbound"
import { rateLimitStep } from "./steps/rateLimit"
import { piiScanStep } from "./steps/piiScan"
import { firewallStep } from "./steps/firewall"
import { budgetStep } from "./steps/budget"
import { contextLoaderStep } from "./steps/contextLoader"
import { messageBuilderStep } from "./steps/messageBuilder"
import { llmCallStep } from "./steps/llmCall"
import { outputParserStep } from "./steps/outputParser"
import { intentExecutorStep } from "./steps/intentExecutor"
import { outputGuardrailsStep } from "./steps/outputGuardrails"
import { usageRecorderStep } from "./steps/usageRecorder"
import { outboundPersisterStep } from "./steps/outboundPersister"
import type { PipelineContext } from "./types"

/**
 * Ordered step pipeline. Steps 1–8 can short-circuit (break),
 * steps 9–16 always run to completion.
 */
const steps = [
  normalizeStep,        // 1
  ensureCustomerStep,   // 2
  dedupStep,            // 3
  persistInboundStep,   // 4
  rateLimitStep,        // 5
  piiScanStep,          // 6
  firewallStep,         // 7
  budgetStep,           // 8
  contextLoaderStep,    // 9
  messageBuilderStep,   // 10
  llmCallStep,          // 11
  outputParserStep,     // 12
  intentExecutorStep,   // 13
  outputGuardrailsStep, // 14
  usageRecorderStep,    // 15
  outboundPersisterStep,// 16
]

/**
 * Entry point — process an inbound WhatsApp text through the
 * full AI pipeline (normalize → guardrails → LLM → output guardrails
 * → persist). Identical public signature to the previous monolithic
 * `pipeline.ts` for backward compatibility.
 */
export async function processMessage(
  input: PipelineInput,
  trace?: TraceContext,
): Promise<PipelineResult> {
  const ctx: PipelineContext = {
    input,
    trace: trace ?? new TraceContext("pipeline"),
    ownerId: input.ownerId,
  }
  return runSteps(steps, ctx)
}
