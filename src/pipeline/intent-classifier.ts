import { LLMOutput } from '../types/index.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';
import { chat } from '../ai/engine.js';
import { buildSystemPrompt, MerchantInfo, ProductEntry } from '../ai/prompts.js';
import { validateLLMOutput } from '../ai/validator.js';

/**
 * Classify the intent of an incoming customer message using the LLM.
 * Fetches merchant context (AI agent settings, products), builds the system
 * prompt, calls the LLM, and returns a structured output.
 */
export async function classifyIntent(
  merchantId: string,
  message: string,
): Promise<LLMOutput> {
  // ── Fetch merchant context ─────────────────────────
  const [merchant, products, aiAgent] = await Promise.all([
    prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { businessName: true, address: true, phone: true },
    }),
    prisma.product.findMany({
      where: { merchantId, isAvailable: true },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        isAvailable: true,
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.aIAgent.findUnique({
      where: { merchantId },
      select: { systemPrompt: true, model: true, knowledgeBase: true },
    }),
  ]);

  if (!merchant) {
    throw new Error(`Merchant not found: ${merchantId}`);
  }

  // ── Build system prompt ────────────────────────────
  const merchantInfo: MerchantInfo = {
    businessName: merchant.businessName,
    address: merchant.address,
    phone: merchant.phone,
  };

  const productEntries: ProductEntry[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    stock: p.stock,
    isAvailable: p.isAvailable,
    categoryName: p.category?.name ?? null,
  }));

  const basePrompt = buildSystemPrompt(merchantInfo, productEntries);

  // If merchant has custom system prompt in AIAgent, append it
  const systemPrompt = aiAgent?.systemPrompt
    ? `${basePrompt}\n\nInstruksi tambahan merchant:\n${aiAgent.systemPrompt}`
    : basePrompt;

  const model = aiAgent?.model ?? undefined;

  // If knowledge base exists, append it
  const finalPrompt = aiAgent?.knowledgeBase
    ? `${systemPrompt}\n\nPengetahuan tambahan:\n${aiAgent.knowledgeBase}`
    : systemPrompt;

  // ── Call LLM via chat() convenience function ───────
  const result = await chat(finalPrompt, message, { model });
  logger.debug({ raw: result.content }, 'LLM raw response');

  // ── Validate ───────────────────────────────────────
  const validated = await validateLLMOutput(result.content, { merchantId });

  if (!validated.data) {
    logger.warn({ errors: validated.validation.errors }, 'LLM validation failed');
    return {
      intent: 'unknown',
      reply: 'Maaf, saya tidak mengerti. Bisa diulang?',
    };
  }

  return validated.data;
}
