import { expect, test, describe } from "bun:test"
import type { PipelineInput } from "@/types/ai"
import { normalizeStep } from "@/ai/pipeline/steps/normalize"
import { TraceContext } from "@/debug/tracer"

function makeInput(text: string): PipelineInput {
  return { ownerId: "test", phone: "62812", text }
}

function trace() { return new TraceContext("test") }

describe("normalizeStep", () => {
  test("returns continue with normalized text for valid input", async () => {
    const result = await normalizeStep.run(makeInput("  Halo  "), { trace: trace() })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.normalized).toBe("Halo")
    }
  })

  test("breaks on empty input", async () => {
    const result = await normalizeStep.run(makeInput(""), { trace: trace() })
    expect(result.ok).toBe(false)
  })

  test("breaks on whitespace-only input", async () => {
    const result = await normalizeStep.run(makeInput("   "), { trace: trace() })
    expect(result.ok).toBe(false)
  })
})
