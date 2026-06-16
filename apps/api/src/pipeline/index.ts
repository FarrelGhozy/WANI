/**
 * Message Pipeline Module
 *
 * Handles incoming WhatsApp message processing:
 * - Deduplication, routing, and intent classification
 * - Order parsing with DB validation
 * - Product inquiry handling
 * - Human escalation flow
 */

export { handleIncomingMessage } from './router.js';
export type { WaIncomingMessage, RoutingContext } from './router.js';
export { classifyIntent } from './intent-classifier.js';
export { processOrder } from './order-parser.js';
export type { OrderResult } from './order-parser.js';
export { handleInquiry } from './inquiry-handler.js';
export { escalateConversation } from './escalation.js';
