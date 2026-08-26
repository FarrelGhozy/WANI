import { describe, test, expect, mock } from "bun:test";

// Budget tracker hits Prisma — mock it so this suite stays offline.
const mockUpsert = mock((args: any) => Promise.resolve(args.create));
mock.module("@/config/db", () => ({
  prisma: {
    usageCounter: { upsert: mockUpsert },
  } as any,
}));

import { withCircuit, getCircuitState, resetCircuit } from "@/ai/circuit-breaker";
import { recordLlmUsage } from "@/guardrails/budget";
import { checkRateLimit, resetRateLimits } from "@/guardrails/ratelimit";
import {
  TraceContext,
  storeTrace,
  getTraces,
  getTraceById,
  clearTraces,
} from "@/debug/tracer";

describe("concurrency safety (#183)", () => {
  test("circuit breaker: 10 parallel failures trip cleanly, no lost updates", async () => {
    resetCircuit();
    let executed = 0;

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        withCircuit(async () => {
          executed++;
          throw new Error("boom");
        })
      )
    );

    // Every call was denied a reply
    expect(results.every((r) => r.allowed === false)).toBe(true);
    // Mutex serializes execution; breaker opens at threshold so the rest
    // of the burst is rejected without executing fn (no double counting).
    expect(executed).toBe(3);
    const state = getCircuitState();
    expect(state.state).toBe("open");
    expect(state.failures).toBe(3);
  });

  test("circuit breaker: open state rejects without running fn", async () => {
    resetCircuit();
    let executed = 0;
    const fail = async () => {
      executed++;
      throw new Error("boom");
    };

    // Trip the breaker
    for (let i = 0; i < 3; i++) await withCircuit(fail);
    expect(executed).toBe(3);

    // While OPEN, fn must not execute
    const rejected = await withCircuit(fail);
    expect(rejected.allowed).toBe(false);
    expect(executed).toBe(3);
  });

  test("circuit breaker: mixed success/failure converges to clean state", async () => {
    resetCircuit();

    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        withCircuit(async () => {
          if (i % 2 === 0) throw new Error("odd one fails");
          return "ok";
        })
      )
    );

    // Last writer wins is acceptable; corrupted/negative counts are not
    const state = getCircuitState();
    expect(state.failures).toBeGreaterThanOrEqual(0);
    expect(["open", "closed", "half-open"]).toContain(state.state);
  });

  test("budget tracker: concurrent usage records issue atomic upserts", async () => {
    mockUpsert.mockClear();

    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        recordLlmUsage({ promptTokens: i + 1, completionTokens: 2 })
      )
    );

    // One atomic upsert per call — never a read-then-write pattern
    expect(mockUpsert).toHaveBeenCalledTimes(10);
    for (const call of mockUpsert.mock.calls) {
      const args = call[0];
      expect(args.update.llmCalls).toEqual({ increment: 1 });
      expect(typeof args.update.tokensIn.increment).toBe("number");
    }
  });

  test("rate limiter: 20 concurrent requests admit exactly rateShortMax", async () => {
    resetRateLimits();

    const results = Array.from({ length: 20 }, () =>
      checkRateLimit("wa-stress-key")
    );
    const allowed = results.filter((r) => r.allowed).length;
    const notify = results.filter((r) => !r.allowed && r.notify).length;

    expect(allowed).toBe(8); // RATE_LIMIT_SHORT_MAX default
    expect(results.length - allowed).toBe(12);
    expect(notify).toBe(1); // soft notice fires exactly on transition
  });

  test("tracer: interleaved traces are all captured intact", async () => {
    clearTraces();

    const ids: string[] = [];
    const pairs = new Map<string, string>();
    await Promise.all(
      Array.from({ length: 50 }, async (_, i) => {
        const ctx = new TraceContext(`6281${String(i).padStart(2, "0")}`);
        ctx.begin("step_a");
        await new Promise((r) => setTimeout(r, i % 3)); // force interleaving
        ctx.set("idx", i);
        ctx.begin("step_b");
        ctx.finish({
          reply: `reply-${i}`,
          intent: "test",
          blocked: false,
        });
        storeTrace(ctx);
        ids.push(ctx.id);
        pairs.set(ctx.id, `reply-${i}`);
      })
    );

    const traces = getTraces(500);
    expect(traces.length).toBe(50);
    expect(new Set(traces.map((t) => t.id)).size).toBe(50); // no clobbering

    const expectedReply = pairs.get(ids[7]!)!;
    const sample = getTraceById(ids[7]!);
    expect(sample?.result?.reply).toBe(expectedReply);
    expect(sample?.steps.map((s) => s.name)).toEqual(["step_a", "step_b"]);
  });
});
