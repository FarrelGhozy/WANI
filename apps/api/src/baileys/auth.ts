import type { AuthenticationState, AuthenticationCreds, SignalDataTypeMap, SignalDataSet, SignalKeyStore } from '@whiskeysockets/baileys';
import type { Prisma } from '@wani/database';
import { prisma } from '../config/prisma.js';
import { logger } from '../config/logger.js';

// ─── Types ─────────────────────────────────────────────

interface PersistedAuth {
  creds: AuthenticationCreds;
  keys: Record<string, Record<string, unknown>>;
}

// ─── Auth State Factory ───────────────────────────────

/**
 * Creates a custom AuthenticationState that persists creds & signal keys
 * into the `creds` JSONB column of the WaSession table via Prisma.
 *
 * Usage:
 *   const { state, saveCreds } = await createAuthState(merchantId);
 *   const sock = makeWASocket({ auth: state, ... });
 */
export async function createAuthState(merchantId: string): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}> {
  // ── helpers ──────────────────────────────────────────────────

  /** Load full persisted blob from DB */
  async function loadPersisted(): Promise<PersistedAuth | null> {
    try {
      const session = await prisma.waSession.findUnique({
        where: { merchantId },
        select: { creds: true },
      });
      if (!session?.creds) return null;

      const raw = session.creds as unknown as PersistedAuth;
      return raw;
    } catch (err) {
      logger.error({ err, merchantId }, 'Failed to load auth state from DB');
      return null;
    }
  }

  /** Write full persisted blob to DB (upsert) */
  async function persist(data: PersistedAuth): Promise<void> {
    try {
      await prisma.waSession.upsert({
        where: { merchantId },
        create: {
          merchantId,
          creds: data as unknown as Prisma.InputJsonValue,
          status: 'disconnected',
        },
        update: {
          creds: data as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      logger.error({ err, merchantId }, 'Failed to persist auth state');
    }
  }

  // ── initialise from DB or default creds ──────────────────────

  const persisted = await loadPersisted();
  let creds: AuthenticationCreds;
  let keyStoreData: Record<string, Record<string, unknown>>;

  if (persisted) {
    creds = persisted.creds;
    keyStoreData = persisted.keys ?? {};
  } else {
    // First-time: Baileys will populate creds when QR is generated
    // We still initialise with an empty structure expected by the library
    creds = {
      noiseKey: undefined!,
      pairingEphemeralKeyPair: undefined!,
      advSecretKey: '',
      signedIdentityKey: undefined!,
      signedPreKey: undefined!,
      registrationId: 0,
      firstUnuploadedPreKeyId: 0,
      nextPreKeyId: 0,
      processedHistoryMessages: [],
      accountSyncCounter: 0,
      accountSettings: {
        unarchiveChats: false,
      },
      registered: false,
      pairingCode: undefined,
      lastPropHash: undefined,
      routingInfo: undefined,
    } as unknown as AuthenticationCreds;

    keyStoreData = {};
  }

  // ── Signal Key Store (backed by JSONB) ──────────────────────

  const keys: SignalKeyStore = {
    async get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Promise<{ [id: string]: SignalDataTypeMap[T] }> {
      const bucket = keyStoreData[type] ?? {};
      const result: Record<string, SignalDataTypeMap[T]> = {};

      for (const id of ids) {
        const val = bucket[id];
        if (val !== undefined) {
          result[id] = val as SignalDataTypeMap[T];
        }
      }

      return result;
    },

    async set(data: SignalDataSet): Promise<void> {
      for (const [type, entries] of Object.entries(data)) {
        if (!entries) continue;

        if (!keyStoreData[type]) {
          keyStoreData[type] = {};
        }

        for (const [id, value] of Object.entries(entries)) {
          if (value === null) {
            delete keyStoreData[type][id];
          } else {
            keyStoreData[type][id] = value;
          }
        }
      }

      // Persist to DB after each set
      await persist({ creds, keys: keyStoreData });
    },
  };

  // ── saveCreds helper ────────────────────────────────────────

  let saveCredsTimeout: ReturnType<typeof setTimeout> | null = null;

  async function saveCreds(): Promise<void> {
    // Debounce rapid creds-update events
    if (saveCredsTimeout) {
      clearTimeout(saveCredsTimeout);
    }

    saveCredsTimeout = setTimeout(async () => {
      saveCredsTimeout = null;
      await persist({ creds, keys: keyStoreData });
    }, 500);
  }

  // ── return AuthenticationState ─────────────────────────────

  return {
    state: { creds, keys },
    saveCreds,
  };
}

// ─── WaSession Status Helpers ──────────────────────────

/** Update the status column of a WaSession row */
export async function updateSessionStatus(
  merchantId: string,
  status: string,
  qrCode?: string | null,
): Promise<void> {
  try {
    await prisma.waSession.upsert({
      where: { merchantId },
      create: { merchantId, status, qrCode: qrCode ?? null },
      update: { status, qrCode: qrCode ?? null },
    });
  } catch (err) {
    logger.error({ err, merchantId, status }, 'Failed to update session status');
  }
}

/** Delete a WaSession row (e.g. on logout / expired) */
export async function deleteSession(merchantId: string): Promise<void> {
  try {
    await prisma.waSession.deleteMany({ where: { merchantId } });
  } catch (err) {
    logger.error({ err, merchantId }, 'Failed to delete session');
  }
}
