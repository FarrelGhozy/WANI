import { EventEmitter } from 'events';
import {
  makeWASocket,
  type WASocket,
  type UserFacingSocketConfig,
  type BaileysEventEmitter,
} from '@whiskeysockets/baileys';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import type { WaConnectionState } from '../types/index.js';
import { createAuthState, updateSessionStatus, deleteSession } from './auth.js';
import { registerHandlers, type MessageHandler, type MessageEventPayload } from './handlers.js';
import { sendText, sendImage, sendVideo, markRead, sendTyping } from './sender.js';
import { handleIncomingMessage as pipelineHandleMessage } from '../pipeline/index.js';

// ─── Constants ─────────────────────────────────────────

const MAX_RECONNECT_DELAY_MS = 60_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;
const RECONNECT_DELAY_MULTIPLIER = 2;

// ─── Connection Map (singletons per merchant) ─────────

const instances = new Map<string, BaileysManager>();

// ─── Manager Class ─────────────────────────────────────

export class BaileysManager extends EventEmitter {
  private merchantId: string;
  private sock: WASocket | null = null;
  private ev: BaileysEventEmitter | null = null;
  private _state: WaConnectionState = 'disconnected';
  private _qr: string | null = null;

  // Reconnection
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private closing = false;

  // Logger
  private log: ReturnType<typeof logger.child>;

  private constructor(merchantId: string) {
    super();
    this.merchantId = merchantId;
    this.log = logger.child({ merchantId, module: 'baileys-manager' });
  }

  // ── Singleton access ──────────────────────────────────

  /**
   * Get (or create) the BaileysManager instance for a given merchant.
   */
  static getInstance(merchantId: string): BaileysManager {
    let instance = instances.get(merchantId);
    if (!instance) {
      instance = new BaileysManager(merchantId);
      instances.set(merchantId, instance);
    }
    return instance;
  }

  /**
   * Remove a manager instance from the singleton map.
   */
  static removeInstance(merchantId: string): void {
    const instance = instances.get(merchantId);
    if (instance) {
      instance.disconnect().catch(() => {});
      instances.delete(merchantId);
    }
  }

  // ── Public API ────────────────────────────────────────

  /** Current state */
  get state(): WaConnectionState {
    return this._state;
  }

  /** Current QR string (null if not available) */
  get qr(): string | null {
    return this._qr;
  }

  /** The underlying WASocket (null if disconnected) */
  get socket(): WASocket | null {
    return this.sock;
  }

  /** The Baileys event emitter */
  get eventEmitter(): BaileysEventEmitter | null {
    return this.ev;
  }

  /**
   * Connect (or reconnect) to WhatsApp.
   */
  async connect(): Promise<void> {
    if (this._state === 'connecting' || this._state === 'connected') {
      this.log.warn('Already connecting/connected');
      return;
    }

    this.closing = false;
    this.shouldReconnect = true;
    await this.doConnect();
  }

  /**
   * Gracefully disconnect from WhatsApp.
   */
  async disconnect(): Promise<void> {
    this.closing = true;
    this.shouldReconnect = false;
    this.cancelReconnect();

    if (this.sock) {
      try {
        await this.sock.end(undefined);
      } catch (err) {
        this.log.error({ err }, 'Error during sock.end');
      }
      this.sock = null;
      this.ev = null;
    }

    this.transition('disconnected');
    await updateSessionStatus(this.merchantId, 'disconnected');
  }

  /**
   * Get the current connection state.
   */
  getStatus(): WaConnectionState {
    return this._state;
  }

  /**
   * Get the current QR code (if any).
   */
  getQR(): string | null {
    return this._qr;
  }

  // ── Message Sending Helpers ──────────────────────────

  /**
   * Send a text message.
   */
  async sendText(to: string, text: string): Promise<string | undefined> {
    this.ensureConnected();
    return sendText(this.sock!, to, text);
  }

  /**
   * Send an image message from a URL.
   */
  async sendImage(to: string, url: string, caption?: string): Promise<string | undefined> {
    this.ensureConnected();
    return sendImage(this.sock!, to, url, caption);
  }

  /**
   * Send a video message from a URL.
   */
  async sendVideo(to: string, url: string, caption?: string): Promise<string | undefined> {
    this.ensureConnected();
    return sendVideo(this.sock!, to, url, caption);
  }

  /**
   * Mark a message as read.
   */
  async markRead(to: string, messageId: string): Promise<void> {
    this.ensureConnected();
    return markRead(this.sock!, to, messageId);
  }

  /**
   * Send typing indicator.
   */
  async sendTyping(to: string, isTyping = true): Promise<void> {
    this.ensureConnected();
    return sendTyping(this.sock!, to, isTyping);
  }

  // ── Internal ─────────────────────────────────────────

  private async doConnect(): Promise<void> {
    this.transition('connecting');
    this._qr = null;
    await updateSessionStatus(this.merchantId, 'connecting');

    try {
      // Load auth state from database
      const { state, saveCreds } = await createAuthState(this.merchantId);
      // Create a pino child for Baileys internal logging
      const baileysLog = logger.child({
        module: 'baileys',
        merchantId: this.merchantId,
      }) as unknown as typeof logger;

      const socketConfig: UserFacingSocketConfig = {
        auth: state,
        logger: baileysLog,
        printQRInTerminal: false, // We handle QR ourselves via event
        browser: ['WANI', 'Chrome', '10.0.0'],
        emitOwnEvents: true,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        fireInitQueries: true,
        generateHighQualityLinkPreview: false,
        shouldIgnoreJid: (jid) => jid.includes('@g.us') || jid.includes('@broadcast'),
        getMessage: async () => undefined,
        cachedGroupMetadata: async () => undefined,
      };

      // Force phone number connection if configured
      if (config.whatsapp.phone && !state.creds.registered) {
        (socketConfig as any).phoneNumber = config.whatsapp.phone;
      }

      const result = makeWASocket(socketConfig);
      this.sock = result as unknown as WASocket;
      this.ev = result.ev as unknown as BaileysEventEmitter;

      // Register event handlers
      registerHandlers(
        this.sock,
        this.ev,
        this.merchantId,
        this.onMessage.bind(this),
        {
          onQR: this.onQR.bind(this),
          onOpen: this.onOpen.bind(this),
          onClose: this.onClose.bind(this),
          onExpired: this.onExpired.bind(this),
        },
        saveCreds,
      );

      this.log.info('Socket created, waiting for connection...');
    } catch (err) {
      this.log.error({ err }, 'Failed to create socket');
      this.transition('disconnected');

      if (this.shouldReconnect && !this.closing) {
        this.scheduleReconnect();
      }
    }
  }

  // ── State Transitions ────────────────────────────────

  private transition(newState: WaConnectionState): void {
    const oldState = this._state;
    if (oldState === newState) return;

    this._state = newState;
    this.log.info({ from: oldState, to: newState }, 'State transition');
    this.emit('stateChange', newState, oldState);
  }

  // ── Connection Callbacks ─────────────────────────────

  private onQR(qr: string): void {
    this._qr = qr;
    this.emit('qr', qr);
    // Store QR in DB for retrieval via API
    updateSessionStatus(this.merchantId, 'connecting', qr).catch((err) =>
      this.log.error({ err }, 'Failed to store QR in DB'),
    );
  }

  private onOpen(): void {
    this.reconnectAttempt = 0;
    this._qr = null;
    this.transition('connected');
    updateSessionStatus(this.merchantId, 'connected').catch((err) =>
      this.log.error({ err }, 'Failed to update session status to connected'),
    );
  }

  private onClose(_reason?: string): void {
    this._qr = null;
    this.transition('disconnected');
    this.sock = null;
    this.ev = null;

    updateSessionStatus(this.merchantId, 'disconnected').catch((err) =>
      this.log.error({ err }, 'Failed to update session status to disconnected'),
    );

    if (this.shouldReconnect && !this.closing) {
      this.scheduleReconnect();
    }
  }

  private onExpired(): void {
    this._qr = null;
    this.shouldReconnect = false;
    this.transition('expired');
    this.sock = null;
    this.ev = null;

    // Clear session data
    deleteSession(this.merchantId).catch((err) =>
      this.log.error({ err }, 'Failed to delete expired session'),
    );

    this.emit('expired');
  }

  // ── Message Handler ─────────────────────────────────

  private async onMessage(payload: MessageEventPayload): Promise<void> {
    this.emit('message', payload);
    defaultMessageHandler(payload).catch((err) =>
      this.log.error({ err }, 'defaultMessageHandler error'),
    );
  }

  // ── Reconnection Logic ──────────────────────────────

  private scheduleReconnect(): void {
    this.cancelReconnect();

    const delay = Math.min(
      INITIAL_RECONNECT_DELAY_MS * Math.pow(RECONNECT_DELAY_MULTIPLIER, this.reconnectAttempt),
      MAX_RECONNECT_DELAY_MS,
    );

    this.reconnectAttempt++;
    this.log.info({ attempt: this.reconnectAttempt, delayMs: delay }, 'Scheduling reconnect');

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      if (this.shouldReconnect && !this.closing) {
        this.log.info('Attempting reconnect');
        await this.doConnect();
      }
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ── Guard ───────────────────────────────────────────

  private ensureConnected(): void {
    if (this._state !== 'connected' || !this.sock) {
      throw new Error('WhatsApp not connected');
    }
  }
}

// ─── Default Message Handler ─────────────────────────

/**
 * Process incoming messages through the AI pipeline and send auto-replies.
 */
export const defaultMessageHandler: MessageHandler = async (payload) => {
  logger.info(
    { from: payload.jid, text: payload.text.slice(0, 100), merchantId: payload.merchantId },
    '📩 WA message received',
  );

  const fromJid = payload.jid.replace(/[^0-9]/g, '');
  const manager = BaileysManager.getInstance(payload.merchantId);

  try {
    const reply = await pipelineHandleMessage(payload.merchantId, {
      id: payload.raw.key?.id || '',
      from: fromJid,
      text: payload.text,
      senderName: payload.raw.pushName || undefined,
    });

    if (reply && manager.state === 'connected' && manager.socket) {
      await sendText(manager.socket, payload.jid, reply);
      logger.info({ to: payload.jid, reply: reply.slice(0, 80) }, 'Auto-reply sent');
    }
  } catch (err) {
    logger.error({ err, from: payload.jid }, 'Pipeline handler error');
  }
};
