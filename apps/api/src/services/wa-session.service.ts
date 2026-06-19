import QRCode from 'qrcode';
import { prisma } from '../config/prisma.js';
import { BaileysManager } from '../baileys/index.js';
import { success } from '../utils/helpers.js';

async function qrToDataUrl(qr: string | null): Promise<string | null> {
  if (!qr) return null;
  try {
    return await QRCode.toDataURL(qr, { width: 256, margin: 2 });
  } catch {
    return qr;
  }
}

export async function getSessionStatus(merchantId: string) {
  try {
    const manager = BaileysManager.getInstance(merchantId);
    const state = manager.state;
    const qrCode = manager.qr;

    const session = await prisma.waSession.findUnique({
      where: { merchantId },
      select: { id: true, status: true, updatedAt: true, createdAt: true, creds: true },
    });

    let phone: string | null = null;
    if (session?.creds && typeof session.creds === 'object') {
      const creds = session.creds as Record<string, unknown>;
      if (creds.me && typeof creds.me === 'object') {
        const me = creds.me as Record<string, unknown>;
        phone = (me.id as string)?.split(':')[0] || null;
      }
    }

    const qrDataUrl = await qrToDataUrl(qrCode || session?.qrCode || null);

    return success({
      id: session?.id || null,
      status: state,
      qrCode: qrDataUrl,
      phone,
      connectedSince: state === 'connected' ? (session?.updatedAt ?? null) : null,
      lastDisconnected: null,
      retryCount: 0,
      createdAt: session?.createdAt || null,
      updatedAt: session?.updatedAt || null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get session status';
    return { success: false, error: message };
  }
}

export async function initiateConnection(merchantId: string) {
  try {
    const manager = BaileysManager.getInstance(merchantId);

    if (manager.state === 'connected') {
      return { success: false, error: 'Already connected' };
    }

    if (manager.state === 'connecting') {
      return { success: false, error: 'Already connecting' };
    }

    await manager.connect().catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 1500));

    const qrCode = manager.qr;
    if (qrCode) {
      return success({ qrCode: await qrToDataUrl(qrCode), status: 'connecting' });
    }

    const session = await prisma.waSession.findUnique({
      where: { merchantId },
      select: { qrCode: true },
    });

    if (session?.qrCode) {
      return success({ qrCode: await qrToDataUrl(session.qrCode), status: 'connecting' });
    }

    return success({ qrCode: null, status: 'connecting', message: 'Waiting for QR code...' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to initiate connection';
    return { success: false, error: message };
  }
}

export async function getQRCode(merchantId: string) {
  try {
    const manager = BaileysManager.getInstance(merchantId);
    const qrCode = manager.qr;

    if (qrCode) {
      return success({ qrCode: await qrToDataUrl(qrCode), expiresIn: 45, refreshedAt: new Date().toISOString() });
    }

    const session = await prisma.waSession.findUnique({
      where: { merchantId },
      select: { qrCode: true },
    });

    if (session?.qrCode) {
      return success({
        qrCode: await qrToDataUrl(session.qrCode),
        expiresIn: 45,
        refreshedAt: new Date().toISOString(),
      });
    }

    return { success: false, error: 'No QR code available. Initiate connection first.' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get QR code';
    return { success: false, error: message };
  }
}

export async function disconnectSession(merchantId: string) {
  try {
    const manager = BaileysManager.getInstance(merchantId);

    if (manager.state === 'disconnected') {
      return { success: false, error: 'Already disconnected' };
    }

    await manager.disconnect();
    return success({ status: 'disconnected' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to disconnect';
    return { success: false, error: message };
  }
}

export async function getSessionHistory(merchantId: string) {
  try {
    const session = await prisma.waSession.findUnique({
      where: { merchantId },
      select: {
        status: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!session) {
      return success({
        history: [],
        message: 'No session history available',
      });
    }

    return success({
      history: [
        {
          status: session.status,
          timestamp: session.updatedAt,
        },
      ],
      currentStatus: session.status,
      sessionCreated: session.createdAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get session history';
    return { success: false, error: message };
  }
}
