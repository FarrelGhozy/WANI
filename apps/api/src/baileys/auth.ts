import type { AuthenticationState, AuthenticationCreds, SignalDataTypeMap, SignalDataSet, SignalKeyStore } from '@whiskeysockets/baileys';
import { initAuthCreds } from '@whiskeysockets/baileys/lib/Utils/auth-utils.js';
import type { Prisma } from '@wani/database';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

interface PersistedAuth {
  creds: AuthenticationCreds;
  keys: Record<string, Record<string, unknown>>;
}

export async function createAuthState(merchantId: string): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  async function loadPersisted(): Promise<PersistedAuth | null> {
    try {
      const session = await prisma.waSession.findUnique({
        where: { merchantId },
        select: { creds: true },
      });
      if (!session?.creds) return null;
      return session.creds as unknown as PersistedAuth;
    } catch (err) {
      logger.error({ err, merchantId }, 'Failed to load auth state from DB');
      return null;
    }
  }

  async function persist(data: PersistedAuth): Promise<void> {
    try {
      await prisma.waSession.upsert({
        where: { merchantId },
        create: { merchantId, creds: data as unknown as Prisma.InputJsonValue, status: 'disconnected' },
        update: { creds: data as unknown as Prisma.InputJsonValue },
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2003') {
        logger.warn({ merchantId }, 'Merchant not found, skipping auth persist');
      } else {
        logger.error({ err, merchantId }, 'Failed to persist auth state');
      }
    }
  }

  const persisted = await loadPersisted();
  let creds: AuthenticationCreds;
  let keyStoreData: Record<string, Record<string, unknown>>;

  if (persisted) {
    creds = persisted.creds;
    keyStoreData = persisted.keys ?? {};
  } else {
    creds = initAuthCreds();
    keyStoreData = {};
  }

  const keys: SignalKeyStore = {
    async get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Promise<{ [id: string]: SignalDataTypeMap[T] }> {
      const bucket = keyStoreData[type] ?? {};
      const r: Record<string, SignalDataTypeMap[T]> = {};
      for (const id of ids) { const v = bucket[id]; if (v !== undefined) r[id] = v as SignalDataTypeMap[T]; }
      return r;
    },
    async set(data: SignalDataSet): Promise<void> {
      for (const [type, entries] of Object.entries(data)) {
        if (!entries) continue;
        if (!keyStoreData[type]) keyStoreData[type] = {};
        for (const [id, value] of Object.entries(entries)) {
          if (value === null) delete keyStoreData[type][id];
          else keyStoreData[type][id] = value;
        }
      }
      await persist({ creds, keys: keyStoreData });
    },
  };

  let saveCredsTimeout: ReturnType<typeof setTimeout> | null = null;
  async function saveCreds(): Promise<void> {
    if (saveCredsTimeout) clearTimeout(saveCredsTimeout);
    saveCredsTimeout = setTimeout(async () => {
      saveCredsTimeout = null;
      await persist({ creds, keys: keyStoreData });
    }, 500);
  }

  return { state: { creds, keys }, saveCreds };
}

export async function updateSessionStatus(merchantId: string, status: string, qrCode?: string | null): Promise<void> {
  try {
    await prisma.waSession.upsert({
      where: { merchantId },
      create: { merchantId, status, qrCode: qrCode ?? null },
      update: { status, qrCode: qrCode ?? null },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'P2003') {
      logger.warn({ merchantId, status }, 'Merchant not found, skipping session update');
    } else {
      logger.error({ err, merchantId, status }, 'Failed to update session status');
    }
  }
}

export async function deleteSession(merchantId: string): Promise<void> {
  try {
    await prisma.waSession.deleteMany({ where: { merchantId } });
  } catch (err) {
    logger.error({ err, merchantId }, 'Failed to delete session');
  }
}
