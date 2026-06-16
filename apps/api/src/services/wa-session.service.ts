import { prisma } from '../config/prisma.js';
import { BaileysManager } from '../baileys/index.js';
import { success } from '../utils/helpers.js';

export async function getSessionStatus(merchantId: string) {
  try {
    const manager = BaileysManager.getInstance(merchantId);
    const state = manager.state;

    const session = await prisma.waSession.findUnique({
      where: { merchantId },
      select: { status: true, updatedAt: true, createdAt: true },
    });

    return success({
      status: state,
      phone: null,
      connectedSince: state === 'connected' ? (session?.updatedAt ?? null) : null,
      lastDisconnected: null,
      retryCount: 0,
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
      return success({ qrCode, status: 'connecting' });
    }

    const session = await prisma.waSession.findUnique({
      where: { merchantId },
      select: { qrCode: true },
    });

    if (session?.qrCode) {
      return success({ qrCode: session.qrCode, status: 'connecting' });
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
      return success({ qrCode, expiresIn: 45, refreshedAt: new Date().toISOString() });
    }

    const session = await prisma.waSession.findUnique({
      where: { merchantId },
      select: { qrCode: true },
    });

    if (session?.qrCode) {
      return success({
        qrCode: session.qrCode,
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
