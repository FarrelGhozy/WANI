import type { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../config/logger.js';
import { downloadAndBuffer } from '../utils/helpers.js';

// ─── Sender Helpers ───────────────────────────────────

/**
 * Send a plain text message to a WhatsApp user.
 *
 * @param sock  Active WASocket instance
 * @param jid   Recipient JID (e.g. '6281234567890@s.whatsapp.net')
 * @param text  Message body
 * @returns     The sent message key ID, or undefined on failure
 */
export async function sendText(
  sock: WASocket,
  jid: string,
  text: string,
): Promise<string | undefined> {
  try {
    const result = await sock.sendMessage(jid, { text });
    logger.info({ jid, msgId: result?.key?.id, text: text.slice(0, 80) }, 'Text sent');
    return result?.key?.id ?? undefined;
  } catch (err) {
    logger.error({ err, jid }, 'Failed to send text message');
    throw err;
  }
}

/**
 * Send an image message to a WhatsApp user.
 *
 * @param sock    Active WASocket instance
 * @param jid     Recipient JID
 * @param url     Public URL of the image to send
 * @param caption Optional caption for the image
 * @returns       The sent message key ID, or undefined on failure
 */
export async function sendImage(
  sock: WASocket,
  jid: string,
  url: string,
  caption?: string,
): Promise<string | undefined> {
  try {
    const buffer = await downloadAndBuffer(url);

    const result = await sock.sendMessage(jid, {
      image: buffer,
      caption: caption ?? '',
    });

    logger.info({ jid, msgId: result?.key?.id }, 'Image sent');
    return result?.key?.id ?? undefined;
  } catch (err) {
    logger.error({ err, jid, url }, 'Failed to send image message');
    throw err;
  }
}

/**
 * Send a video message to a WhatsApp user.
 *
 * @param sock    Active WASocket instance
 * @param jid     Recipient JID
 * @param url     Public URL of the video to send
 * @param caption Optional caption
 * @returns       The sent message key ID, or undefined on failure
 */
export async function sendVideo(
  sock: WASocket,
  jid: string,
  url: string,
  caption?: string,
): Promise<string | undefined> {
  try {
    const buffer = await downloadAndBuffer(url);

    const result = await sock.sendMessage(jid, {
      video: buffer,
      caption: caption ?? '',
    });

    logger.info({ jid, msgId: result?.key?.id }, 'Video sent');
    return result?.key?.id ?? undefined;
  } catch (err) {
    logger.error({ err, jid, url }, 'Failed to send video message');
    throw err;
  }
}

/**
 * Mark a message as read.
 */
export async function markRead(
  sock: WASocket,
  jid: string,
  messageId: string,
): Promise<void> {
  try {
    await sock.readMessages([{ remoteJid: jid, id: messageId, fromMe: false } as any]);
  } catch (err) {
    logger.error({ err, jid, messageId }, 'Failed to mark message as read');
  }
}

/**
 * Send a typing indicator to a chat.
 */
export async function sendTyping(
  sock: WASocket,
  jid: string,
  isTyping = true,
): Promise<void> {
  try {
    await sock.sendPresenceUpdate(isTyping ? 'composing' : 'paused', jid);
  } catch (err) {
    logger.error({ err, jid }, 'Failed to send typing indicator');
  }
}
