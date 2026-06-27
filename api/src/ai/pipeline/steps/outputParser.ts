import { LLMOutputSchema } from "@/src/ai/schemas"
import type { LLMOutput } from "@/src/types/ai"
import type { PipelineStep } from "../types"

/**
 * Step 12 — Parse raw LLM output (JSON → Zod → regex fallback).
 */
export const outputParserStep: PipelineStep = {
  name: "parse_output",
  async run(ctx) {
    const raw = ctx.completion!.content.trim()
    const llmOutput = await parseLLMResponse(raw)
    ctx.llmOutput = llmOutput
    ctx.llmIntent = llmOutput.intent
    ctx.trace.set("intent", llmOutput.intent)
    return { kind: "continue" }
  },
}

async function parseLLMResponse(raw: string): Promise<LLMOutput> {
  // Attempt 1 — parse full text as JSON
  try {
    const parsed = JSON.parse(raw)
    const validated = await LLMOutputSchema.safeParseAsync(parsed)
    if (validated.success) return validated.data as LLMOutput
  } catch {
    // not valid JSON — fall through to attempt 2
  }

  // Attempt 2 — extract JSON object from surrounding text
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const retry = await LLMOutputSchema.safeParseAsync(JSON.parse(jsonMatch[0]))
      if (retry.success) return retry.data as LLMOutput
    }
  } catch {
    // still failed — return default
  }

  return { intent: "unknown", reply: "Maaf, bisa diulang lagi? Saya kurang paham." }
}
