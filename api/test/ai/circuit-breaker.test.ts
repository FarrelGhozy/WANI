import { expect, test, describe, beforeEach } from "bun:test"
import { State, withCircuit, getCircuitState, resetCircuit, breakerRegistry } from "@/src/ai/circuit-breaker"

describe("Circuit Breaker — per-label registry", () => {
  beforeEach(() => {
    resetCircuit()
  })

  test("starts CLOSED (no failures)", () => {
    const state = getCircuitState()
    expect(state.state).toBe(State.Closed)
    expect(state.failures).toBe(0)
  })

  test("allows calls when CLOSED", async () => {
    const result = await withCircuit(async () => "success")
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.result).toBe("success")
    }
  })

  test("records failures", async () => {
    await withCircuit(async () => { throw new Error("fail") })
    await withCircuit(async () => { throw new Error("fail") })

    const state = getCircuitState()
    expect(state.failures).toBe(2)
    expect(state.state).toBe(State.Closed)
  })

  test("opens after 3 failures", async () => {
    for (let i = 0; i < 3; i++) {
      await withCircuit(async () => { throw new Error(`fail ${i}`) })
    }

    const state = getCircuitState()
    expect(state.failures).toBe(3)
    expect(state.state).toBe(State.Open)
  })

  test("rejects calls when OPEN", async () => {
    for (let i = 0; i < 3; i++) {
      await withCircuit(async () => { throw new Error("fail") })
    }

    const result = await withCircuit(async () => "should not run")
    expect(result.allowed).toBe(false)
  })

  test("resetCircuit clears all state", async () => {
    for (let i = 0; i < 5; i++) {
      await withCircuit(async () => { throw new Error("fail") })
    }

    expect(getCircuitState().state).toBe(State.Open)
    resetCircuit()
    expect(getCircuitState().state).toBe(State.Closed)
    expect(getCircuitState().failures).toBe(0)
  })

  test("per-label isolation — one label failing does not affect others", async () => {
    // Open the "classifier" breaker
    for (let i = 0; i < 3; i++) {
      await withCircuit(async () => { throw new Error("classifier fail") }, "classifier")
    }
    expect(getCircuitState("classifier").state).toBe(State.Open)

    // "llm" breaker should still be closed
    expect(getCircuitState("llm").state).toBe(State.Closed)

    // "llm" calls still succeed
    const result = await withCircuit(async () => "llm ok")
    expect(result.allowed).toBe(true)
    if (result.allowed) {
      expect(result.result).toBe("llm ok")
    }
  })

  test("breakerRegistry.states() returns all labels", async () => {
    await withCircuit(async () => { throw new Error("f1") }, "classifier")
    await withCircuit(async () => { throw new Error("f2") }, "judge")

    const states = breakerRegistry.states()
    expect(states["classifier"]).toBeDefined()
    expect(states["judge"]).toBeDefined()
    expect(states["llm"]).toBeDefined()
  })
})
