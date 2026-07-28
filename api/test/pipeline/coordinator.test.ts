import { expect, test, describe } from "bun:test"
import { PipelineBuilder } from "@/src/ai/pipeline/builder"
import type { Step } from "@/src/ai/pipeline/types"
import { ok, fail } from "@/src/ai/pipeline/either"
import { TraceContext } from "@/src/debug/tracer"

function trace() { return new TraceContext("test") }

describe("PipelineBuilder", () => {
  test("runs all steps in order", async () => {
    const order: number[] = []
    const stepA: Step<number, number> = {
      name: "a",
      async run(i, _ctx) { order.push(1); return ok(i) },
    }
    const stepB: Step<number, number> = {
      name: "b",
      async run(i, _ctx) { order.push(2); return ok(i) },
    }
    const stepC: Step<number, number> = {
      name: "c",
      async run(i, _ctx) { order.push(3); return ok(i + 1) },
    }

    const pipeline = PipelineBuilder.start<number>().pipe(stepA).pipe(stepB).pipe(stepC).build()
    // When last step returns a number, the builder coerces it — we only verify order
    await pipeline(0, trace())
    expect(order).toEqual([1, 2, 3])
  })

  test("short-circuits on first fail", async () => {
    const order: number[] = []
    const stepA: Step<number, number> = {
      name: "a",
      async run(i, _ctx) { order.push(1); return ok(i) },
    }
    const stepB: Step<number, number> = {
      name: "b",
      async run(i, _ctx) { order.push(2); return fail({ type: "short_circuit", reply: "blocked", intent: "test_block" }) },
    }
    const stepC: Step<number, number> = {
      name: "c",
      async run(i, _ctx) { order.push(3); return ok(i) },
    }

    const pipeline = PipelineBuilder.start<number>().pipe(stepA).pipe(stepB).pipe(stepC).build()
    const result = await pipeline(0, trace())
    expect(order).toEqual([1, 2])
    expect(result.reply).toBe("blocked")
  })
})
