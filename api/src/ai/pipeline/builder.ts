import { TraceContext } from "@/src/debug/tracer"
import type { PipelineResult } from "@/src/types/ai"
import type { Either } from "./either"
import type { Step, StepError } from "./types"
import { STEP_REPLIES } from "./types"

function toPipelineResult(e: StepError): PipelineResult {
  if (e.type === "internal") {
    return { reply: STEP_REPLIES.FALLBACK, intent: "error", blocked: true, qrisImageUrl: null }
  }
  return { reply: e.reply, intent: e.intent, blocked: true, qrisImageUrl: null }
}
