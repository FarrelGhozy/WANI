import { LLMOutputSchema } from "@/ai/schemas";
import type { LLMOutput } from "@/types/ai";
import type { LlmInput, ParsedInput, Step } from "../types";
import { ok } from "../either";

export const outputParserStep: Step<LlmInput, ParsedInput> = {
  name: "parse_output",
  async run(input, { trace }) {
    const raw = input.completion.content.trim();
    const llmOutput = await parseLLMResponse(raw);
    trace.set("intent", llmOutput.intent);

    return ok({
      ownerId: input.ownerId,
      phone: input.phone,
      name: input.name,
      waMsgId: input.waMsgId,
      text: input.text,
      normalized: input.normalized,
      customerId: input.customerId,
      customerPhone: input.customerPhone,
      conversationId: input.conversationId,
      storeInfo: input.storeInfo,
      products: input.products,
      aiConfig: input.aiConfig,
      systemPrompt: input.systemPrompt,
      historyMessages: input.historyMessages,
      completion: input.completion,
      llmOutput,
      llmIntent: llmOutput.intent,
    });
  },
};

async function parseLLMResponse(raw: string): Promise<LLMOutput> {
  try {
    const parsed = JSON.parse(raw);
    const validated = await LLMOutputSchema.safeParseAsync(parsed);
    if (validated.success) return validated.data as LLMOutput;
  } catch {
    /* not valid JSON, didn't work bruh, trying next approach*/
  }

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const retry = await LLMOutputSchema.safeParseAsync(
        JSON.parse(jsonMatch[0]),
      );
      if (retry.success) return retry.data as LLMOutput;
    }
  } catch {
    /* still failed, lose aura :V */
  }

  return {
    intent: "unknown",
    reply: "Maaf, bisa diulang lagi? Saya kurang paham.",
  };
}
