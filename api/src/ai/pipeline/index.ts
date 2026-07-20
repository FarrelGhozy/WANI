import { TraceContext } from "@/src/debug/tracer"
import type { PipelineInput, PipelineResult } from "@/src/types/ai"
import { PipelineBuilder } from "./builder"
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

const pipeline = PipelineBuilder.start<PipelineInput>()
  .pipe(normalizeStep)
  .pipe(ensureCustomerStep)
  .pipe(dedupStep)
  .pipe(persistInboundStep)
  .pipe(rateLimitStep)
  .pipe(piiScanStep)
  .pipe(firewallStep)
  .pipe(budgetStep)
  .pipe(contextLoaderStep)
  .pipe(messageBuilderStep)
  .pipe(llmCallStep)
  .pipe(outputParserStep)
  .pipe(intentExecutorStep)
  .pipe(outputGuardrailsStep)
  .pipe(usageRecorderStep)
  .pipe(outboundPersisterStep)
  .build()

export async function processMessage(input: PipelineInput, trace?: TraceContext): Promise<PipelineResult> {
  return pipeline(input, trace)
}
