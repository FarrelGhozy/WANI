import type { PrismaClient } from "@db/client"
import { initAuthCreds, BufferJSON, type AuthenticationState } from "@whiskeysockets/baileys"
import type { SignalKeyStore } from "@whiskeysockets/baileys"

export function usePrismaAuthState(db: PrismaClient): {
  state: AuthenticationState
  saveCreds: () => Promise<void>
} {
  const writeCreds = async (creds: AuthenticationState["creds"]) => {
    await db.creds.upsert({
      where: { id: "pairing" },
      create: { id: "pairing", data: JSON.stringify(creds, BufferJSON.replacer) },
      update: { data: JSON.stringify(creds, BufferJSON.replacer) },
    })
  }

  const readCreds = async (): Promise<AuthenticationState["creds"]> => {
    const row = await db.creds.findUnique({ where: { id: "pairing" } })
    if (row) {
      return JSON.parse(row.data, BufferJSON.reviver)
    }
    const creds = initAuthCreds()
    await writeCreds(creds)
    return creds
  }

  const keys: SignalKeyStore = {
    async get(type, ids) {
      const rows = await db.signalKey.findMany({
        where: { type: type as string, id: { in: ids } },
      })
      const map = new Map(rows.map((r) => [r.id, r.data]))
      return Object.fromEntries(
        ids.map((id) => [id, map.has(id) ? JSON.parse(map.get(id)!, BufferJSON.reviver) : null])
      )
    },
    async set(data) {
      for (const [type, entries] of Object.entries(data)) {
        for (const [id, value] of Object.entries(entries!)) {
          if (value === null) {
            await db.signalKey.deleteMany({ where: { type, id } })
          } else {
            await db.signalKey.upsert({
              where: { type_id: { type, id } },
              create: { type, id, data: JSON.stringify(value, BufferJSON.replacer) },
              update: { data: JSON.stringify(value, BufferJSON.replacer) },
            })
          }
        }
      }
    },
  }

  const state: AuthenticationState = {
    creds: undefined as unknown as AuthenticationState["creds"],
    keys,
  }

  const saveCreds = async (): Promise<void> => {
    await writeCreds(state.creds)
  }

  const init = async () => {
    state.creds = await readCreds()
  }

  const promise = init()

  return {
    state,
    saveCreds: async () => {
      await promise
      await saveCreds()
    },
  }
}
