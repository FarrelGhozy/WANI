import type { PipelineContext, PipelineStep } from "./types"
import type { PipelineResult } from "@/src/types/ai"

/**
 * Execute an ordered array of pipeline steps, passing a shared context
 * through each. If any step returns `{ kind: "break", result }` the
 * pipeline short-circuits immediately with that result.
 *
 * After all steps complete, a final `PipelineResult` is constructed
 * from whatever the last step wrote to the context.
 */
export async function runSteps(
  steps: PipelineStep[],
  ctx: PipelineContext,
): Promise<PipelineResult> {
  for (const step of steps) {
    ctx.trace.begin(step.name)
    const outcome = await step.run(ctx)
    if (outcome.kind === "break") {
      return outcome.result
    }
  }

  return buildResult(ctx)
}

function buildResult(ctx: PipelineContext): PipelineResult {
  return {
    reply: ctx.finalReply ?? "",
    intent: ctx.llmIntent ?? "unknown",
    blocked: false,
    qrisImageUrl: ctx.actionQrisUrl ?? null,
  }
}
