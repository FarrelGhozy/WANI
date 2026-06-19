import type { AuthenticationState, AuthenticationCreds, SignalDataTypeMap, SignalDataSet, SignalKeyStore } from '@whiskeysockets/baileys';
import { initAuthCreds } from '@whiskeysockets/baileys/lib/Utils/auth-utils.js';
import type { Prisma } from '@wani/database';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

const BASE64_KEY_FIELDS = new Set([
  'public', 'private', 'signature',
  'deviceSignature', 'accountSignature', 'accountSignatureKey',
  'identifierKey',
]);

function convertKeysToBuffer(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (!val || typeof val !== 'object') continue;
    if (BASE64_KEY_FIELDS.has(key) && typeof val === 'string') {
      try { obj[key] = Buffer.from(val as string, 'base64'); } catch { /* keep as-is */ }
      continue;
    }
    if (typeof (val as any).public === 'string' || typeof (val as any).private === 'string') {
      for (const subKey of Object.keys(val as Record<string, unknown>)) {
        if (BASE64_KEY_FIELDS.has(subKey) && typeof (val as any)[subKey] === 'string') {
          try { (val as any)[subKey] = Buffer.from((val as any)[subKey], 'base64'); } catch { /* keep as-is */ }
        }
      }
    }
    if (typeof (val as any).keyPair === 'object') {
      convertKeysToBuffer(val as Record<string, unknown>);
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item && typeof item === 'object') convertKeysToBuffer(item as Record<string, unknown>);
      }
    }
  }
}

/** Fix a creds object in-place: convert base64 key strings back to Buffers */
export function fixCredsKeys(creds: Record<string, unknown>): void {
  convertKeysToBuffer(creds);
}

function serializeForDb(data: PersistedAuth): PersistedAuth {
  function toBase64(v: unknown): unknown {
    if (!v || typeof v !== 'object') return v;
    if (v instanceof Uint8Array || Buffer.isBuffer(v)) return Buffer.from(v).toString('base64');
    if (Array.isArray(v)) return v.map(toBase64);
    const r: any = {};
    for (const [k, val] of Object.entries(v)) {
      if (BASE64_KEY_FIELDS.has(k) && (val instanceof Uint8Array || Buffer.isBuffer(val))) {
        r[k] = Buffer.from(val).toString('base64');
      } else {
        r[k] = toBase64(val);
      }
    }
    return r;
  }
  return toBase64(data) as PersistedAuth;
}

function reviveFromDb<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveFromDb) as unknown as T;
  if (Buffer.isBuffer(obj)) return obj;
  const r: any = {};
  for (const [k, v] of Object.entries(obj)) {
    let val = v;
    if (BASE64_KEY_FIELDS.has(k) && typeof v === 'string') {
      try { val = Buffer.from(v, 'base64'); } catch { /* keep as string */ }
    } else if (typeof v === 'object' && v !== null && !Buffer.isBuffer(v)) {
      val = reviveFromDb(v);
    }
    r[k] = val;
  }
  return r;
}

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
      return reviveFromDb(session.creds as unknown as PersistedAuth);
    } catch (err) {
      logger.error({ err, merchantId }, 'Failed to load auth state from DB');
      return null;
    }
  }

  async function persist(data: PersistedAuth): Promise<void> {
    try {
      const serialized = serializeForDb(data);
      await prisma.waSession.upsert({
        where: { merchantId },
        create: { merchantId, creds: serialized as unknown as Prisma.InputJsonValue, status: 'disconnected' },
        update: { creds: serialized as unknown as Prisma.InputJsonValue },
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
    // Fix in-memory creds keys immediately (Baileys may have set base64 strings)
    fixCredsKeys(creds as unknown as Record<string, unknown>);
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
