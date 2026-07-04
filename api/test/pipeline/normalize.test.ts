import { expect, test, describe } from "bun:test"
import { normalizeStep } from "@/src/ai/pipeline/steps/normalize"
import type { PipelineContext } from "@/src/ai/pipeline/types"

function makeCtx(text: string): PipelineContext {
  return {
    ownerId: "test",
    input: { ownerId: "test", phone: "62812", text },
    trace: { set: () => null as any, begin: () => null as any } as any,
  }
}

describe("normalizeStep", () => {
  test("returns continue with normalized text for valid input", async () => {
    const ctx = makeCtx("  Halo  ")
    const result = await normalizeStep.run(ctx)
    expect(result.kind).toBe("continue")
    expect(ctx.normalized).toBe("Halo")
  })

  test("breaks on empty input", async () => {
    const ctx = makeCtx("")
    const result = await normalizeStep.run(ctx)
    expect((result as any).kind).toBe("break")
    if (result.kind === "break") {
      expect(result.result.blocked).toBe(true)
    }
  })

  test("breaks on whitespace-only input", async () => {
    const ctx = makeCtx("   ")
    const result = await normalizeStep.run(ctx)
    expect((result as any).kind).toBe("break")
  })
})
