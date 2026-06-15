// ─── Baileys WhatsApp Engine Module ────────────────────
//
// This module provides a complete WhatsApp WebSocket interface
// built on @whiskeysockets/baileys v7.
//
// Components:
//   manager.ts   - BaileysManager class (connection lifecycle, reconnection, state machine)
//   auth.ts      - Custom auth state persisted via Prisma WaSession table
//   handlers.ts  - Event handler registration (connection.update, messages.upsert)
//   sender.ts    - Message sending helpers (text, image, video, buttons)
//
// ─── Exports ─────────────────────────────────────────────

export { BaileysManager, defaultMessageHandler } from './manager.js';
export type { MessageEventPayload, MessageHandler, ConnectionCallbacks } from './handlers.js';
export { createAuthState, updateSessionStatus, deleteSession } from './auth.js';
export { sendText, sendImage, sendVideo, markRead, sendTyping } from './sender.js';
