import type { BaileysEventEmitter, WAMessage, WASocket } from '@whiskeysockets/baileys';
import { logger } from '../config/logger.js';

// ─── Message Event Payload ─────────────────────────────

export interface MessageEventPayload {
  /** The remote JID (sender) */
  jid: string;
  /** Decoded text content (empty string for non-text messages) */
  text: string;
  /** Raw WAMessage from Baileys */
  raw: WAMessage;
  /** Whether this message was sent by the linked device */
  fromMe: boolean;
  /** The merchant this message belongs to */
  merchantId: string;
}

export type MessageHandler = (payload: MessageEventPayload) => void | Promise<void>;

// ─── Connection Callbacks ──────────────────────────────

export interface ConnectionCallbacks {
  onQR: (qr: string) => void;
  onOpen: () => void;
  onClose: (reason?: string) => void;
  onExpired: () => void;
}

// ─── Event Registration ────────────────────────────────

/**
 * Register all Baileys event handlers for a given socket.
 *
 * @param sock       The WASocket instance (used for sendMessage etc.)
 * @param ev         The Baileys event emitter
 * @param merchantId The merchant this connection belongs to
 * @param onMessage  Callback fired for every incoming notify message
 * @param connCbs    Connection lifecycle callbacks
 * @param saveCreds  Function to persist creds after creds.update
 */
export function registerHandlers(
  _sock: WASocket,
  ev: BaileysEventEmitter,
  merchantId: string,
  onMessage: MessageHandler,
  connCbs: ConnectionCallbacks,
  saveCreds: () => Promise<void>,
): void {
  const log = logger.child({ merchantId, module: 'baileys-handlers' });

  // ── Connection State ─────────────────────────────────-─────

  ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log.info('QR code received');
      connCbs.onQR(qr);
    }

    if (connection === 'open') {
      log.info('Connection opened');
      connCbs.onOpen();
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode
        ?? (lastDisconnect?.error as any)?.status
        ?? 500;

      const shouldReconnect = statusCode !== 401; // loggedOut / badSession

      log.warn(
        { statusCode, shouldReconnect },
        'Connection closed',
      );

      if (shouldReconnect) {
        connCbs.onClose(String(statusCode));
      } else {
        connCbs.onExpired();
      }
    }
  });

  // ── Credentials Update ───────────────────────────────-─────

  ev.on('creds.update', () => {
    saveCreds().catch((err) => {
      log.error({ err }, 'Failed to save credentials after update');
    });
  });

  // ── Incoming Messages ────────────────────────────────-─────

  ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      void handleIncomingMessage(msg, merchantId, onMessage, log);
    }
  });

  // ── Messages Update (e.g., status edits) ─────────────

  ev.on('messages.update', (updates) => {
    for (const u of updates) {
      log.debug({ key: u.key, update: u.update }, 'Message updated');
    }
  });
}

// ─── Incoming Message Processing ───────────────────────

async function handleIncomingMessage(
  msg: WAMessage,
  merchantId: string,
  onMessage: MessageHandler,
  log: typeof logger,
): Promise<void> {
  try {
    const key = msg.key;
    if (!key || !key.remoteJid) return;

    // Skip group/system messages (handle only 1:1)
    if (key.remoteJid.includes('@g.us') || key.remoteJid.includes('@broadcast')) {
      return;
    }

    // Skip own messages
    if (key.fromMe) return;

    // Extract text content
    const text = extractText(msg);
    if (!text) return;

    const payload: MessageEventPayload = {
      jid: key.remoteJid,
      text,
      raw: msg,
      fromMe: key.fromMe ?? false,
      merchantId,
    };

    log.info(
      { jid: key.remoteJid, msgId: key.id, text: text.slice(0, 80) },
      'Incoming message',
    );

    await onMessage(payload);
  } catch (err) {
    log.error({ err, msgId: msg.key?.id }, 'Error handling incoming message');
  }
}

// ─── Text Extraction ───────────────────────────────────

/**
 * Extract human-readable text from a WAMessage.
 * Handles extendedTextMessage, conversation, image/video captions, etc.
 */
function extractText(msg: WAMessage): string {
  const m = msg.message;

  if (!m) return '';

  // Conversation (plain text)
  if (m.conversation) return m.conversation;

  // Extended text message (includes link previews, mentions)
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;

  // Image/Video with caption
  if (m.imageMessage?.caption) return m.imageMessage.caption;
  if (m.videoMessage?.caption) return m.videoMessage.caption;
  if (m.documentMessage?.caption) return m.documentMessage.caption;

  // Audio messages (no text, but we might want to handle them later)
  if (m.audioMessage) return '';

  // Sticker / Contact / Location — no text
  if (m.stickerMessage) return '';
  if (m.contactMessage) return '';
  if (m.locationMessage) return '';
  if (m.liveLocationMessage) return '';

  // Buttons & lists
  if (m.buttonsResponseMessage?.selectedButtonId) return m.buttonsResponseMessage.selectedButtonId ?? '';
  if (m.listResponseMessage?.singleSelectReply?.selectedRowId) return m.listResponseMessage.singleSelectReply.selectedRowId ?? '';
  if (m.templateButtonReplyMessage?.selectedId) return m.templateButtonReplyMessage.selectedId ?? '';
  if (m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const params = JSON.parse(m.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
      return params?.id ?? '';
    } catch { /* ignore */ }
  }

  // Poll creation / reaction
  if (m.pollCreationMessage) return '';
  if (m.reactionMessage) return '';

  // Protocol / system messages
  if (m.protocolMessage) return '';
  if (m.senderKeyDistributionMessage) return '';

  return '';
}
