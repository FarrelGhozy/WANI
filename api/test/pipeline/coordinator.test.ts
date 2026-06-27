import { expect, test, describe } from "bun:test"
import { runSteps } from "@/src/ai/pipeline/coordinator"
import type { PipelineContext, PipelineStep } from "@/src/ai/pipeline/types"

function makeCtx(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    input: { phone: "628123456789", text: "Halo" },
    trace: { set: () => null as any, begin: () => null as any } as any,
    ...overrides,
  }
}

describe("coordinator", () => {
  test("runs all steps in order when none break", async () => {
    const order: number[] = []
    const steps: PipelineStep[] = [
      { name: "a", async run(_ctx) { order.push(1); return { kind: "continue" } } },
      { name: "b", async run(_ctx) { order.push(2); return { kind: "continue" } } },
      { name: "c", async run(_ctx) { order.push(3); return { kind: "continue" } } },
    ]
    await runSteps(steps, makeCtx())
    expect(order).toEqual([1, 2, 3])
  })

  test("short-circuits on first break", async () => {
    const order: number[] = []
    const steps: PipelineStep[] = [
      { name: "a", async run(_ctx) { order.push(1); return { kind: "continue" } } },
      {
        name: "b",
        async run(_ctx) {
          order.push(2)
          return { kind: "break", result: { reply: "blocked", intent: "test", blocked: true, qrisImageUrl: null } }
        },
      },
      { name: "c", async run(_ctx) { order.push(3); return { kind: "continue" } } },
    ]
    const result = await runSteps(steps, makeCtx())
    expect(order).toEqual([1, 2])
    expect(result).toEqual({ reply: "blocked", intent: "test", blocked: true, qrisImageUrl: null })
  })

  test("builds result from context when all steps pass", async () => {
    const steps: PipelineStep[] = [
      {
        name: "setter",
        async run(ctx) {
          ctx.finalReply = "hai juga"
          ctx.llmIntent = "greeting"
          return { kind: "continue" }
        },
      },
    ]
    const result = await runSteps(steps, makeCtx())
    expect(result.reply).toBe("hai juga")
    expect(result.intent).toBe("greeting")
    expect(result.blocked).toBe(false)
  })

  test("context flows between steps", async () => {
    const steps: PipelineStep[] = [
      {
        name: "set_normalized",
        async run(ctx) {
          ctx.normalized = "normalized text"
          return { kind: "continue" }
        },
      },
      {
        name: "reader",
        async run(ctx) {
          expect(ctx.normalized).toBe("normalized text")
          ctx.finalReply = "processed: " + ctx.normalized
          return { kind: "continue" }
        },
      },
    ]
    const result = await runSteps(steps, makeCtx())
    expect(result.reply).toBe("processed: normalized text")
  })

  test("empty steps array builds default result", async () => {
    const result = await runSteps([], makeCtx())
    expect(result).toEqual({ reply: "", intent: "unknown", blocked: false, qrisImageUrl: null })
  })
})
