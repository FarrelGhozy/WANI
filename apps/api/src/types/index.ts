import { OrderStatus } from '@prisma/client';

// ─── LLM Output Types ───────────────────────────────────

export interface OrderItemInput {
  name: string;
  qty: number;
}

export type LLMOutput =
  | { intent: 'order';     items: OrderItemInput[]; notes?: string }
  | { intent: 'inquiry';   query: string }
  | { intent: 'greeting';  reply: string }
  | { intent: 'complaint'; reply: string; escalate: boolean }
  | { intent: 'unknown';   reply: string }
  | { intent: 'escalate';  reason: string };

// ─── Validation Result ──────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Order State Machine ────────────────────────────────

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:     ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:   ['PROCESSING', 'CANCELLED'],
  PROCESSING:  ['COMPLETED', 'CANCELLED'],
  COMPLETED:   [],
  CANCELLED:   [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── Baileys Connection States ──────────────────────────

export type WaConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'expired';

// ─── API Response ───────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ─── Pagination ─────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
}
