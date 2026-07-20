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

export class PipelineBuilder<I, O> {
  private constructor(private readonly steps: Array<Step<any, any>>) {}

  static start<I>(): PipelineBuilder<I, I> {
    return new PipelineBuilder<I, I>([])
  }

  pipe<Next>(step: Step<O, Next>): PipelineBuilder<I, Next> {
    return new PipelineBuilder<I, Next>([...this.steps, step])
  }

  build(): (input: I, trace?: TraceContext) => Promise<PipelineResult> {
    return async (input, trace) => {
      const tr = trace ?? new TraceContext("pipeline")
      let current: unknown = input

      for (const step of this.steps) {
        tr.begin(step.name)
        const result: Either<StepError, unknown> = await step.run(current, { trace: tr })
        if (!result.ok) {
          return toPipelineResult(result.error)
        }
        current = result.value
      }

      return current as PipelineResult
    }
  }
}
