import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import { withCircuit, getCircuitState, resetCircuit } from "@/src/ai/circuit-breaker"

describe("Circuit Breaker", () => {
  beforeEach(() => {
    resetCircuit()
  })

  test("starts CLOSED (no failures)", () => {
    const state = getCircuitState()
    expect(state.state).toBe("closed")
    expect(state.failures).toBe(0)
  })

  test("allows calls when CLOSED", async () => {
    const result = await withCircuit(async () => "success")
    expect(result.allowed).toBe(true)
    expect(result.result).toBe("success")
  })

  test("records failures", async () => {
    await withCircuit(async () => { throw new Error("fail") })
    await withCircuit(async () => { throw new Error("fail") })

    const state = getCircuitState()
    expect(state.failures).toBe(2)
    expect(state.state).toBe("closed")
  })

  test("opens after 3 failures", async () => {
    for (let i = 0; i < 3; i++) {
      await withCircuit(async () => { throw new Error(`fail ${i}`) })
    }

    const state = getCircuitState()
    expect(state.failures).toBe(3)
    expect(state.state).toBe("open")
  })

  test("rejects calls when OPEN", async () => {
    for (let i = 0; i < 3; i++) {
      await withCircuit(async () => { throw new Error("fail") })
    }

    const result = await withCircuit(async () => "should not run")
    expect(result.allowed).toBe(false)
    expect(result.result).toBeUndefined()
  })

  test("resetCircuit clears all state", async () => {
    for (let i = 0; i < 5; i++) {
      await withCircuit(async () => { throw new Error("fail") })
    }

    expect(getCircuitState().state).toBe("open")
    resetCircuit()
    expect(getCircuitState().state).toBe("closed")
    expect(getCircuitState().failures).toBe(0)
  })
})
