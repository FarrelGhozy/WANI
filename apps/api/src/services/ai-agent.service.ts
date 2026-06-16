import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../types/index.js';
import { success } from '../utils/helpers.js';
import { createAIAgentSchema, updateAIAgentSchema } from '../lib/validation.js';
import type { CreateAIAgentInput, UpdateAIAgentInput } from '../lib/validation.js';

// ─── CRUD Methods ────────────────────────────────────────

export async function getAIAgent(id: string): Promise<ApiResponse> {
  try {
    const agent = await prisma.aIAgent.findUnique({
      where: { id },
      include: { merchant: { select: { id: true, businessName: true } } },
    });
    if (!agent) return { success: false, error: 'AI Agent not found' };
    return success(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get AI agent';
    return { success: false, error: message };
  }
}

export async function getAIAgentByMerchant(merchantId: string): Promise<ApiResponse> {
  try {
    const agent = await prisma.aIAgent.findUnique({
      where: { merchantId },
    });
    if (!agent) return { success: false, error: 'AI Agent not configured for this merchant' };
    return success(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get AI agent by merchant';
    return { success: false, error: message };
  }
}

export async function createAIAgent(input: CreateAIAgentInput): Promise<ApiResponse> {
  try {
    const parsed = createAIAgentSchema.parse(input);

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({ where: { id: parsed.merchantId } });
    if (!merchant) return { success: false, error: 'Merchant not found' };

    // Check if agent already exists for this merchant
    const existing = await prisma.aIAgent.findUnique({
      where: { merchantId: parsed.merchantId },
    });
    if (existing) {
      return { success: false, error: 'AI Agent already exists for this merchant. Use update instead.' };
    }

    const agent = await prisma.aIAgent.create({
      data: {
        merchantId: parsed.merchantId,
        systemPrompt: parsed.systemPrompt,
        model: parsed.model,
        greetingMessage: parsed.greetingMessage,
        knowledgeBase: parsed.knowledgeBase,
        maxTokens: parsed.maxTokens,
        temperature: parsed.temperature,
      },
    });

    return success(agent);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to create AI agent';
    return { success: false, error: message };
  }
}

export async function updateAIAgent(id: string, input: UpdateAIAgentInput): Promise<ApiResponse> {
  try {
    const parsed = updateAIAgentSchema.parse(input);

    const existing = await prisma.aIAgent.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'AI Agent not found' };

    const data: Record<string, unknown> = {};
    if (parsed.isActive !== undefined) data.isActive = parsed.isActive;
    if (parsed.systemPrompt !== undefined) data.systemPrompt = parsed.systemPrompt;
    if (parsed.model !== undefined) data.model = parsed.model;
    if (parsed.greetingMessage !== undefined) data.greetingMessage = parsed.greetingMessage;
    if (parsed.knowledgeBase !== undefined) data.knowledgeBase = parsed.knowledgeBase;
    if (parsed.maxTokens !== undefined) data.maxTokens = parsed.maxTokens;
    if (parsed.temperature !== undefined) data.temperature = parsed.temperature;

    const agent = await prisma.aIAgent.update({
      where: { id },
      data,
    });

    return success(agent);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.errors.map(e => e.message).join('; ') };
    }
    const message = err instanceof Error ? err.message : 'Failed to update AI agent';
    return { success: false, error: message };
  }
}

export async function deleteAIAgent(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.aIAgent.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'AI Agent not found' };

    await prisma.aIAgent.delete({ where: { id } });
    return success({ deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete AI agent';
    return { success: false, error: message };
  }
}

// ─── Business Methods ────────────────────────────────────

export async function toggleAIAgent(id: string): Promise<ApiResponse> {
  try {
    const existing = await prisma.aIAgent.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'AI Agent not found' };

    const agent = await prisma.aIAgent.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return success(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to toggle AI agent';
    return { success: false, error: message };
  }
}

export async function updateAIAgentPrompt(
  id: string,
  systemPrompt: string,
): Promise<ApiResponse> {
  try {
    const existing = await prisma.aIAgent.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'AI Agent not found' };

    const agent = await prisma.aIAgent.update({
      where: { id },
      data: { systemPrompt },
    });

    return success(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update AI agent prompt';
    return { success: false, error: message };
  }
}

export async function updateAIAgentModel(
  id: string,
  model: string,
  maxTokens?: number,
  temperature?: number,
): Promise<ApiResponse> {
  try {
    const existing = await prisma.aIAgent.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'AI Agent not found' };

    const data: Record<string, unknown> = { model };
    if (maxTokens !== undefined) data.maxTokens = maxTokens;
    if (temperature !== undefined) data.temperature = temperature;

    const agent = await prisma.aIAgent.update({
      where: { id },
      data,
    });

    return success(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update AI agent model';
    return { success: false, error: message };
  }
}

export async function updateKnowledgeBase(
  id: string,
  knowledgeBase: string,
): Promise<ApiResponse> {
  try {
    const existing = await prisma.aIAgent.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'AI Agent not found' };

    const agent = await prisma.aIAgent.update({
      where: { id },
      data: { knowledgeBase },
    });

    return success(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update knowledge base';
    return { success: false, error: message };
  }
}

export async function getActiveAIAgentByMerchant(merchantId: string): Promise<ApiResponse> {
  try {
    const agent = await prisma.aIAgent.findUnique({
      where: { merchantId },
    });
    if (!agent) return { success: false, error: 'AI Agent not configured for this merchant' };
    if (!agent.isActive) return { success: false, error: 'AI Agent is currently disabled' };

    return success(agent);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get active AI agent';
    return { success: false, error: message };
  }
}
